import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { PersonProps } from './PersonProps';
import {createPerson, erasePerson, getPersons, newWebSocket, updatePerson} from './personApi';
import { AuthContext } from '../auth';

import { Plugins } from "@capacitor/core"
import { key } from "ionicons/icons";

const log = getLogger('PersonProvider');
const { Storage } = Plugins;

type SavePersonFn = (person: PersonProps) => Promise<any>;
type DeletePersonFn = (person: PersonProps) => Promise<any>;

export interface PersonsState {
    persons?: PersonProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    deleting: boolean,
    savingError?: Error | null,
    deletingError?: Error | null,
    savePerson?: SavePersonFn,
    deletePerson?: DeletePersonFn;
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: PersonsState = {
    fetching: false,
    saving: false,
    deleting: false,
};

const FETCH_PERSONS_STARTED = 'FETCH_PERSONS_STARTED';
const FETCH_PERSONS_SUCCEEDED = 'FETCH_PERSONS_SUCCEEDED';
const FETCH_PERSONS_FAILED = 'FETCH_PERSONS_FAILED';
const SAVE_PERSON_STARTED = 'SAVE_PERSON_STARTED';
const SAVE_PERSON_SUCCEEDED = 'SAVE_PERSON_SUCCEEDED';
const SAVE_PERSON_FAILED = 'SAVE_PERSON_FAILED';
const DELETE_PERSON_STARTED = "DELETE_PERSON_STARTED";
const DELETE_PERSON_SUCCEEDED = "DELETE_PERSON_SUCCEEDED";
const DELETE_PERSON_FAILED = "DELETE_PERSON_FAILED";

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
        deletingError
    } = state;
    useEffect(getPersonsEffect, [token]);
    useEffect(wsEffect, [token]);
    const savePerson = useCallback<SavePersonFn>(savePersonCallback, [token]);
    const deletePerson = useCallback<DeletePersonFn>(deletePersonCallback, [token]);
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

    async function savePersonCallback(person: PersonProps) {
        try {
            log('savePerson started');
            dispatch({ type: SAVE_PERSON_STARTED });
            const savedPerson = await (person._id ? updatePerson(token, person) : createPerson(token, person));
            log('savePerson succeeded');
            dispatch({ type: SAVE_PERSON_SUCCEEDED, payload: { person: savedPerson } });
        } catch (error) {
            log('savePerson failed');
            dispatch({ type: SAVE_PERSON_FAILED, payload: { error } });
        }
    }

    async function deletePersonCallback(person: PersonProps) {
        try {
            log("delete started");
            dispatch({ type: DELETE_PERSON_STARTED });
            const deletedPerson = await erasePerson(token, person);
            log("delete succeeded");
            console.log(deletedPerson);
            dispatch({ type: DELETE_PERSON_SUCCEEDED, payload: { person: person } });
        } catch (error) {
            log("delete failed");
            dispatch({ type: DELETE_PERSON_FAILED, payload: { error } });
        }
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
