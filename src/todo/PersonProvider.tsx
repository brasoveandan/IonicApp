import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { PersonProps } from './PersonProps';
import {createPerson, erasePerson, getPersons, newWebSocket, updatePerson} from './personApi';
import { AuthContext } from '../auth';

import { Plugins } from "@capacitor/core"

const log = getLogger('PersonProvider');
const { Storage } = Plugins;

type SavePersonFn = (person: PersonProps,connected: boolean) => Promise<any>;
type DeletePersonFn = (person: PersonProps,connected: boolean) => Promise<any>;
type UpdateServerFn = () => Promise<any>;
type ServerPerson = (id: string, version: number) => Promise<any>;

export interface PersonsState {
    persons?: PersonProps[],
    oldPerson?: PersonProps,
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    deleting: boolean,
    savingError?: Error | null,
    deletingError?: Error | null,
    savePerson?: SavePersonFn,
    deletePerson?: DeletePersonFn;
    updateServer?: UpdateServerFn,
    getServerPerson?: ServerPerson,
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: PersonsState = {
    fetching: false,
    saving: false,
    deleting: false,
    oldPerson: undefined,
};

const FETCH_PERSONS_STARTED = 'FETCH_PERSONS_STARTED';
const FETCH_PERSONS_SUCCEEDED = 'FETCH_PERSONS_SUCCEEDED';
const FETCH_PERSONS_FAILED = 'FETCH_PERSONS_FAILED';

const SAVE_PERSON_STARTED = 'SAVE_PERSON_STARTED';
const SAVE_PERSON_SUCCEEDED = 'SAVE_PERSON_SUCCEEDED';
const SAVE_PERSON_SUCCEEDED_OFFLINE = "SAVE_PERSON_SUCCEEDED_OFFLINE";
const SAVE_PERSON_FAILED = 'SAVE_PERSON_FAILED';

const DELETE_PERSON_STARTED = "DELETE_PERSON_STARTED";
const DELETE_PERSON_SUCCEEDED = "DELETE_PERSON_SUCCEEDED";
const DELETE_PERSON_FAILED = "DELETE_PERSON_FAILED";

const CONFLICT_SOLVED = "CONFLICT_SOLVED";

const reducer: (state: PersonsState, action: ActionProps) => PersonsState =
    (state, { type, payload }) => {
        switch (type) {
            case FETCH_PERSONS_STARTED:
                return { ...state, fetching: true, fetchingError: null };
            case FETCH_PERSONS_SUCCEEDED:
                return { ...state, persons: payload.persons, fetching: false };
            case FETCH_PERSONS_FAILED:
                return { ...state, fetchingError: payload.error, fetching: false };
            case SAVE_PERSON_STARTED:
                return { ...state, savingError: null, saving: true };
            case SAVE_PERSON_SUCCEEDED:
                const persons = [...(state.persons || [])];
                const person = payload.person;
                const index = persons.findIndex(it => it._id === person._id);
                if (index === -1) {
                    persons.splice(0, 0, person);
                } else {
                    persons[index] = person;
                }
                return { ...state, persons, saving: false };
            case SAVE_PERSON_FAILED:
                return { ...state, savingError: payload.error, saving: false };

            case DELETE_PERSON_STARTED:
                return { ...state, deletingError: null, deleting: true };
            case DELETE_PERSON_SUCCEEDED: {
                const persons = [...(state.persons || [])];
                const person = payload.person;
                const index = persons.findIndex((it) => it._id === person._id);
                persons.splice(index, 1);
                return { ...state, persons, deleting: false };
            }

            case DELETE_PERSON_FAILED:
                return { ...state, deletingError: payload.error, deleting: false };
            default:
                return state;
        }
    };

export const PersonContext = React.createContext<PersonsState>(initialState);

interface PersonProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const PersonProvider: React.FC<PersonProviderProps> = ({ children }) => {
    const { token } = useContext(AuthContext);
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        persons,
        fetching,
        fetchingError,
        saving,
        deleting,
        savingError,
        deletingError,
        oldPerson
    } = state;
    useEffect(getPersonsEffect, [token]);
    useEffect(wsEffect, [token]);
    const savePerson = useCallback<SavePersonFn>(savePersonCallback, [token]);
    const deletePerson = useCallback<DeletePersonFn>(deletePersonCallback, [token]);
    const updateServer = useCallback<UpdateServerFn>(updateServerCallback, [token]);
    const value = {
        persons,
        fetching,
        fetchingError,
        saving,
        deleting,
        savingError,
        deletingError,
        savePerson,
        deletePerson,
        updateServer,
        oldPerson
    };
    log('returns');
    return (
        <PersonContext.Provider value={value}>
            {children}
        </PersonContext.Provider>
    );

    function getPersonsEffect() {
        let canceled = false;
        fetchPersons();
        return () => {
            canceled = true;
        }

        async function fetchPersons() {
            if (!token?.trim()) {
                return;
            }
            try {
                log('fetchPersons started');
                dispatch({ type: FETCH_PERSONS_STARTED });
                const persons = await getPersons(token);
                log('fetchPersons succeeded');
                if (!canceled) {
                    dispatch({ type: FETCH_PERSONS_SUCCEEDED, payload: { persons } });
                }
            } catch (error) {
                log('fetchPersons failed');
                let realKeys: string[] = [];
                await Storage.keys().then( (keys)  => {
                    return keys.keys.forEach(function (value) {
                        if (value !== "user")
                            realKeys.push(value);
                    })
                });

                let values: string[] = [];
                for (const key1 of realKeys) {
                    await Storage.get({key: key1}).then((value)=>{
                        // @ts-ignore
                        values.push(value.value);
                    })
                }
                const persons: PersonProps[] = [];
                for(const value of values){
                    var person = JSON.parse(value);
                    persons.push(person);
                }
                log(persons);
                log(canceled);
                if (!canceled) {
                    dispatch({type: FETCH_PERSONS_SUCCEEDED, payload: {persons}});
                }
            }
        }
    }

    async function savePersonCallback(person: PersonProps, connected: boolean) {
        try {
            if (!connected) {
                throw new Error();
            }
            log('savePerson started');
            dispatch({ type: SAVE_PERSON_STARTED });
            const savedPerson = await (person._id ? updatePerson(token, person) : createPerson(token, person));
            log('savePerson succeeded');
            dispatch({ type: SAVE_PERSON_SUCCEEDED, payload: { person: savedPerson } });
            dispatch({ type: CONFLICT_SOLVED });
        }
        catch (error) {
            log('savePerson failed with error: ', error);

            if (person._id === undefined) {
                person._id = generateRandomID()
                person.status = 1;
                alert("Person saved locally!!!");
            } else {
                person.status = 2;
                alert("Person updated locally!!!");
            }
            await Storage.set({
                key: person._id,
                value: JSON.stringify(person),
            });

            dispatch({ type: SAVE_PERSON_SUCCEEDED_OFFLINE, payload: { person: person } });
        }
    }

    async function deletePersonCallback(person: PersonProps, connected: boolean) {
        try {
            if (!connected) {
                throw new Error();
            }
            dispatch({ type: DELETE_PERSON_STARTED });
            const deletedProduct = await erasePerson(token, person);
            console.log(deletedProduct);
            await Storage.remove({ key: person._id! });
            dispatch({ type: DELETE_PERSON_SUCCEEDED, payload: { person: person } });
        }
        catch (error) {
            person.status = 3;
            await Storage.set({
                key: JSON.stringify(person._id),
                value: JSON.stringify(person),
            });
            alert("Product deleted locally!!!");
            dispatch({ type: DELETE_PERSON_SUCCEEDED, payload: { person: person } });
        }
    }

    async function updateServerCallback() {
        //grab persons from local storage
        const allKeys = Storage.keys();
        let promisedPersons;
        var i;

        promisedPersons = await allKeys.then(function (allKeys) {
            const promises = [];
            for (i = 0; i < allKeys.keys.length; i++) {
                const promisePerson = Storage.get({ key: allKeys.keys[i] });
                promises.push(promisePerson);
            }
            return promises;
        });

        for (i = 0; i < promisedPersons.length; i++) {
            const promise = promisedPersons[i];
            const person = await promise.then(function (it) {
                var object;
                try {
                    object = JSON.parse(it.value!);
                } catch (e) {
                    return null;
                }
                return object;
            });
            if (person !== null) {
                //person has to be added
                if (person.status === 1) {
                    dispatch({ type: DELETE_PERSON_SUCCEEDED, payload: { person: person } });
                    await Storage.remove({ key: person._id });
                    const oldPerson = person;
                    delete oldPerson._id;
                    oldPerson.status = 0;
                    const newPerson = await createPerson(token, oldPerson);
                    dispatch({ type: SAVE_PERSON_SUCCEEDED, payload: { person: newPerson } });
                    await Storage.set({
                        key: JSON.stringify(newPerson._id),
                        value: JSON.stringify(newPerson),
                    });
                }
                //person has to be updated
                else if (person.status === 2) {
                    person.status = 0;
                    const newPerson = await updatePerson(token, person);
                    dispatch({ type: SAVE_PERSON_SUCCEEDED, payload: { person: newPerson } });
                    await Storage.set({
                        key: JSON.stringify(newPerson._id),
                        value: JSON.stringify(newPerson),
                    });
                }
                //person has to be deleted
                else if (person.status === 3) {
                    person.status = 0;
                    await erasePerson(token, person);
                    await Storage.remove({ key: person._id });
                }
            }
        }
    }

    //generates random id for storing person locally
    function generateRandomID() {
        return "_" + Math.random().toString(36).substr(2, 9);
    }

    function wsEffect() {
        let canceled = false;
        log('wsEffect - connecting');
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = newWebSocket(token, message => {
                if (canceled) {
                    return;
                }
                const { type, payload: person } = message;
                log(`ws message, person ${type}`);
                if (type === 'created' || type === 'updated') {
                    dispatch({ type: SAVE_PERSON_SUCCEEDED, payload: { person } });
                }
            });
        }
        return () => {
            log('wsEffect - disconnecting');
            canceled = true;
            closeWebSocket?.();
        }
    }
};
