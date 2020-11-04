import React, { useContext } from 'react';
import { RouteComponentProps } from 'react-router';
import {
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonList, IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Person from './Person';
import { getLogger } from '../core';
import { PersonContext } from './PersonProvider';

const log = getLogger('PersonList');

const PersonList: React.FC<RouteComponentProps> = ({ history }) => {
    const { persons, fetching, fetchingError } = useContext(PersonContext);
    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>My Agenda</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching Persons" />
                {persons && (
                    <IonList>
                        {persons.map(({ id, nume, prenume, telefon, ocupatie}) =>
                            <Person key={id} id={id} nume={nume} prenume={prenume} telefon={telefon} ocupatie={ocupatie} onEdit={id => history.push(`/person/${id}`)} />)}
                    </IonList>
                )}
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
