import axios from 'axios';
import { authConfig, baseUrl, getLogger, withLogs } from '../core';
import { PersonProps } from './PersonProps';

const personUrl = `http://${baseUrl}/api/person`;

export const getPersons: (token: string) => Promise<PersonProps[]> = token => {
    return withLogs(axios.get(personUrl, authConfig(token)), 'getPersons');
}

export const createPerson: (token: string, person: PersonProps) => Promise<PersonProps[]> = (token, person) => {
    return withLogs(axios.post(personUrl, person, authConfig(token)), 'createPerson');
}

export const updatePerson: (token: string, person: PersonProps) => Promise<PersonProps[]> = (token, person) => {
    return withLogs(axios.put(`${personUrl}/${person._id}`, person, authConfig(token)), 'updatePerson');
}

interface MessageData {
    type: string;
    payload: PersonProps;
}

const log = getLogger('ws');

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`);
    ws.onopen = () => {
        log('web socket onopen');
        ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
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
