// @ts-ignore
import axios from 'axios';
import { getLogger } from '../core';
import { PersonProps } from './PersonProps';

const log = getLogger('personApi');

const baseUrl = 'localhost:3000';
const personUrl = `http://${baseUrl}/person`;

interface ResponseProps<T> {
    data: T;
}

function withLogs<T>(promise: Promise<ResponseProps<T>>, fnName: string): Promise<T> {
    log(`${fnName} - started`);
    return promise
        .then(res => {
            log(`${fnName} - succeeded`);
            return Promise.resolve(res.data);
        })
        .catch(err => {
            log(`${fnName} - failed`);
            return Promise.reject(err);
        });
}

const config = {
    headers: {
        'Content-Type': 'application/json'
    }
};

export const getPersons: () => Promise<PersonProps[]> = () => {
    return withLogs(axios.get(personUrl, config), 'getPersons');
}

export const createPerson: (person: PersonProps) => Promise<PersonProps[]> = person => {
    return withLogs(axios.post(personUrl, person, config), 'createPerson');
}

export const updatePerson: (person: PersonProps) => Promise<PersonProps[]> = person => {
    return withLogs(axios.put(`${personUrl}/${person.id}`, person, config), 'updatePerson');
}

interface MessageData {
    event: string;
    payload: {
        person: PersonProps;
    };
}

export const newWebSocket = (onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`)
    ws.onopen = () => {
        log('web socket onopen');
    };
    ws.onclose = () => {
        log('web socket onclose');
    };
    ws.onerror = error => {
        log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
        log('web socket onmessage');
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}
