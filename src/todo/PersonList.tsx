import React, {useContext, useEffect, useState} from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect } from "react-router-dom";
import {
    IonButton, IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon, IonInfiniteScroll, IonInfiniteScrollContent,
    IonLoading,
    IonPage, IonSearchbar, IonSelect, IonSelectOption,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Person from './Person';
import { getLogger } from '../core';
import { PersonContext } from './PersonProvider';
import {AuthContext} from "../auth";
import {PersonProps} from "./PersonProps";

const log = getLogger('PersonList');

const PersonList: React.FC<RouteComponentProps> = ({ history }) => {
    const { persons, fetching, fetchingError } = useContext(PersonContext);
    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(
        false
    );
    const [filter, setFilter] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState<string>("");
    const [pos, setPos] = useState(11);
    const selectOptions = ["Not set", "Favourites", "Family"];
    const [personsShow, setPersonsShow] = useState<PersonProps[]>([]);
    const { logout } = useContext(AuthContext);
    const handleLogout = () => {
        logout?.();
        return <Redirect to={{ pathname: "/login" }} />;
    };
    useEffect(() => {
        if (persons?.length) {
            setPersonsShow(persons.slice(0, 10));
        }
    }, [persons]);
    log("render");
    async function searchNext($event: CustomEvent<void>) {
        if (persons && pos < persons.length) {
            setPersonsShow([...personsShow, ...persons.slice(pos, 11 + pos)]);
            setPos(pos + 12);
        } else {
            setDisableInfiniteScroll(true);
        }
        ($event.target as HTMLIonInfiniteScrollElement).complete();
    }

    useEffect(() => {
        if (filter && persons) {
            setPersonsShow(persons.filter((person) => person.ocupatie === filter));
        }
    }, [filter]);

    useEffect(() => {
        if (search && persons) {
            setPersonsShow(persons.filter((person) => person.nume.startsWith(search)));
        }
    }, [search]);
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>My Agenda</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleLogout}>
                            Logout
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonLoading isOpen={fetching} message="Fetching Persons" />
                <IonSearchbar
                    value={search}
                    debounce={1000}
                    onIonChange={(e) => setSearch(e.detail.value!)}
                ></IonSearchbar>
                <IonSelect
                    value={filter}
                    placeholder="Selection about group"
                    onIonChange={(e) => setFilter(e.detail.value)}
                >
                    {selectOptions.map((option) => (
                        <IonSelectOption key={option} value={option}>
                            {option}
                        </IonSelectOption>
                    ))}
                </IonSelect>
                {personsShow &&
                personsShow.map((person: PersonProps) => {
                    return (
                        <Person
                            key={person._id}
                            _id={person._id}
                            nume={person.nume}
                            prenume={person.prenume}
                            telefon={person.telefon}
                            ocupatie={person.ocupatie}
                            onEdit={(id) => history.push(`/person/${id}`)}
                        />
                    );
                })}
                <IonInfiniteScroll
                    threshold="10px"
                    disabled={disableInfiniteScroll}
                    onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
                    <IonInfiniteScrollContent loadingText="Loading more contacts..."></IonInfiniteScrollContent>
                </IonInfiniteScroll>
                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch Persons'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/person')}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default PersonList;
