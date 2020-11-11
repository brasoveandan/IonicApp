import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { PersonProps } from './PersonProps';
import { createPerson, getPersons, newWebSocket, updatePerson } from './personApi';
import { AuthContext } from '../auth';

const log = getLogger('PersonProvider');

type SavePersonFn = (person: PersonProps) => Promise<any>;

export interface PersonsState {
    persons?: PersonProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    savePerson?: SavePersonFn,
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: PersonsState = {
    fetching: false,
    saving: false,
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';

const reducer: (state: PersonsState, action: ActionProps) => PersonsState =
    (state, { type, payload }) => {
        switch (type) {
            case FETCH_ITEMS_STARTED:
                return { ...state, fetching: true, fetchingError: null };
            case FETCH_ITEMS_SUCCEEDED:
                return { ...state, persons: payload.persons, fetching: false };
            case FETCH_ITEMS_FAILED:
                return { ...state, fetchingError: payload.error, fetching: false };
            case SAVE_ITEM_STARTED:
                return { ...state, savingError: null, saving: true };
            case SAVE_ITEM_SUCCEEDED:
                const persons = [...(state.persons || [])];
                const person = payload.person;
                const index = persons.findIndex(it => it._id === person._id);
                if (index === -1) {
                    persons.splice(0, 0, person);
                } else {
                    persons[index] = person;
                }
                return { ...state, persons, saving: false };
            case SAVE_ITEM_FAILED:
                return { ...state, savingError: payload.error, saving: false };
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
    const { persons, fetching, fetchingError, saving, savingError } = state;
    useEffect(getPersonsEffect, [token]);
    useEffect(wsEffect, [token]);
    const savePerson = useCallback<SavePersonFn>(savePersonCallback, [token]);
    const value = { persons, fetching, fetchingError, saving, savingError, savePerson };
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
                dispatch({ type: FETCH_ITEMS_STARTED });
                const persons = await getPersons(token);
                log('fetchPersons succeeded');
                if (!canceled) {
                    dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { persons } });
                }
            } catch (error) {
                log('fetchPersons failed');
                dispatch({ type: FETCH_ITEMS_FAILED, payload: { error } });
            }
        }
    }

    async function savePersonCallback(person: PersonProps) {
        try {
            log('savePerson started');
            dispatch({ type: SAVE_ITEM_STARTED });
            const savedPerson = await (person._id ? updatePerson(token, person) : createPerson(token, person));
            log('savePerson succeeded');
            dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { person: savedPerson } });
        } catch (error) {
            log('savePerson failed');
            dispatch({ type: SAVE_ITEM_FAILED, payload: { error } });
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
                    dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { person } });
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
