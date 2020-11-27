import axios from 'axios';
import { authConfig, baseUrl, getLogger, withLogs } from '../core';
import { PersonProps } from './PersonProps';
import { Plugins } from "@capacitor/core";

const { Storage } = Plugins; //local
const personUrl = `http://${baseUrl}/api/person`;

export const getPersons: (token: string) => Promise<PersonProps[]> = token => {
    var result = axios.get(personUrl, authConfig(token));
    result.then(function (result) {
        result.data.forEach(async (person: PersonProps) => {
            await Storage.set({
                key: person._id!,
                value: JSON.stringify({
                    id: person._id,
                    nume: person.nume,
                    prenume: person.prenume,
                    telefon: person.telefon,
                    ocupatie: person.ocupatie,
                }),
            });
        });
    });
    return withLogs(result, "getPersons");
}

export const createPerson: (token: string, person: PersonProps) => Promise<PersonProps[]> = (token, person) => {
        var result = axios.post(personUrl, person, authConfig(token));
        result.then(async function (r) {
            var person = r.data;
            await Storage.set({
                key: person._id!,
                value: JSON.stringify({
                    id: person._id,
                    nume: person.nume,
                    prenume: person.prenume,
                    telefon: person.telefon,
                    ocupatie: person.ocupatie,
                }),
            });
        });
        return withLogs(result, "createPerson");
}

export const updatePerson: (token: string, person: PersonProps) => Promise<PersonProps[]> = (token, person) => {
    var result = axios.put(`${personUrl}/${person._id}`, person, authConfig(token));
    result.then(async function (r) {
        var person = r.data;
        await Storage.set({
            key: person._id!,
            value: JSON.stringify({
                id: person._id,
                nume: person.nume,
                prenume: person.prenume,
                telefon: person.telefon,
                ocupatie: person.ocupatie,
            }),
        });
    });
    return withLogs(result, "updatePerson");
}

export const erasePerson: (token: string, person: PersonProps) => Promise<PersonProps[]> = (token, person) => {
    var result = axios.delete(`${personUrl}/${person._id}`, authConfig(token));
    result.then(async function (r) {
        await Storage.remove({ key: person._id! });
    });
    return withLogs(result, "deletePerson");
};

interface MessageData {
    type: string;
    payload: PersonProps;
}

const log = getLogger('ws');

export const newWebSocket = (
    token: string,
    onMessage: (data: MessageData) => void
    ) => {
    const ws = new WebSocket(`ws://${baseUrl}`);
    ws.onopen = () => {
        log("web socket onopen");
        ws.send(JSON.stringify({ type: "authorization", payload: { token } }));
    };
    ws.onclose = () => {
        log("web socket onclose");
    };
    ws.onerror = (error) => {
        log("web socket onerror", error);
    };
    ws.onmessage = (messageEvent) => {
        log("web socket onmessage");
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}
