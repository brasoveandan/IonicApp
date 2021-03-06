import React, {useContext, useEffect, useState} from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect } from "react-router-dom";
import {
    createAnimation,
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
import {add} from 'ionicons/icons';
import Person from './Person';
import { getLogger } from '../core';
import { PersonContext } from './PersonProvider';
import {AuthContext} from "../auth";
import {PersonProps} from "./PersonProps";
import {useNetwork} from "../utils/useNetwork";

const log = getLogger('PersonList');

const PersonList: React.FC<RouteComponentProps> = ({ history }) => {
    const { persons, fetching, fetchingError, updateServer } = useContext(PersonContext);
    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(
        false
    );
    const [filter, setFilter] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState<string>('');
    const [pos, setPos] = useState(10);
    const selectOptions = ["Not set", "Favourites", "Family"];
    const [personsShow, setPersonsShow] = useState<PersonProps[]>([]);
    const { logout } = useContext(AuthContext);
    const { networkStatus } = useNetwork();

    const handleLogout = () => {
        logout?.();
        return <Redirect to={{ pathname: "/login" }} />;
    };

    //update server when network status is back online
    useEffect(() => {
        if (networkStatus.connected) {
            updateServer && updateServer();
        }
    }, [networkStatus.connected]);


    log("render");
    async function searchNext($event: CustomEvent<void>) {
        if (persons && pos < persons.length) {
            setPersonsShow([...persons.slice(0, 10 + pos)]); //
            setPos(pos + 5);
        } else {
            setDisableInfiniteScroll(true);
        }
        log('products from ' + 0 + " to " + pos)
        log(personsShow)
        await ($event.target as HTMLIonInfiniteScrollElement).complete();
    }

    useEffect(() => {
        if (persons?.length) {
            setPersonsShow(persons.slice(0, pos));
        }
    }, [persons]);

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

    function simpleAnimation() {
        const el = document.querySelector(".networkStatus");
        if (el) {
            const animation = createAnimation()
                .addElement(el)
                .duration(1000)
                .direction("alternate")
                .iterations(Infinity)
                .fromTo('transform', 'translateX(0px)','translateX(30px)')
            animation.play();
        }
    }
    useEffect(simpleAnimation, []);

    function groupAnimations() {
        const elem1 = document.querySelector('.searchBar');
        const elem2 = document.querySelector('.select');
        if (elem1 && elem2) {
            const animation1 = createAnimation()
                .addElement(elem1)
                .fromTo('transform', 'scale(0.8)','scale(1)');
            const animation2 = createAnimation()
                .addElement(elem2)
                .fromTo('transform', 'scale(1)', 'scale(0.8)');
            const parentAnimation = createAnimation()
                .duration(600)
                .direction("alternate")
                .iterations(3)
                .addAnimation([animation1, animation2]);
            parentAnimation.play();    }
    }
    useEffect(groupAnimations, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>My Agenda</IonTitle>
                    <div className="networkStatus">Status: {networkStatus.connected ? "online" : "offline"}</div>
                    <IonButtons slot="end">
                        <IonButton onClick={handleLogout}>
                            Logout
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonLoading isOpen={fetching} message="Fetching Persons" />
                <div className="searchBar">
                    <IonSearchbar
                        value={search}
                        debounce={1000}
                        onIonChange={(e) => setSearch(e.detail.value!)}
                    ></IonSearchbar>
                </div>
                <div className="select">
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
                </div>
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
                            status={person.status}
                            photoPath={person.photoPath}
                            latitude={person.latitude}
                            longitude={person.longitude}
                            onEdit={(id) => history.push(`/person/${id}`)}
                        />
                    );
                })}
                <IonInfiniteScroll
                    threshold="100px"
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
