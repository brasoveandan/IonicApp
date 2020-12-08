import React, { useContext, useEffect, useState } from 'react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput, IonItem, IonLabel, IonListHeader,
    IonLoading,
    IonPage, IonRadio, IonRadioGroup,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { getLogger } from '../core';
import { PersonContext } from './PersonProvider';
import { RouteComponentProps } from 'react-router';
import { PersonProps } from './PersonProps';
import {useNetwork} from "../utils/useNetwork";

const log = getLogger('PersonEdit');

interface PersonEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const PersonEdit: React.FC<PersonEditProps> = ({ history, match }) => {
    const { persons, saving, savingError, savePerson, deletePerson, getServerPerson, oldPerson } = useContext(PersonContext);
    const [nume, setNume] = useState('');
    const [prenume, setPrenume] = useState('');
    const [telefon, setTelefon] = useState('');
    const [ocupatie, setOcupatie] = useState('');
    const [person, setPerson] = useState<PersonProps>();
    const [person2, setPerson2] = useState<PersonProps>();
    const { networkStatus } = useNetwork();
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const person = persons?.find(it => it._id === routeId);
        setPerson(person);
        if (person) {
            setNume(person.nume);
            setPrenume(person.prenume);
            setTelefon(person.telefon);
            setOcupatie(person.ocupatie);
        }
    }, [match.params.id, persons, getServerPerson]);

    useEffect(() => {
        setPerson2(oldPerson);
        log("OLD PRODUCT: " + JSON.stringify(oldPerson));
    }, [oldPerson]);


    const handleSave = () => {
        const editedPerson = person ? { ...person, nume, prenume, telefon, ocupatie, status: 0 } : { nume, prenume, telefon, ocupatie, status: 0 };
        savePerson && savePerson(editedPerson,networkStatus.connected).then(() => { if (person2 === undefined) history.goBack(); })
    };

    const handleDelete = () => {
        const editPerson = person ? { ...person, nume, prenume, telefon, ocupatie, status: 0} : {nume, prenume, telefon, ocupatie, status: 0};
        deletePerson && deletePerson(editPerson,networkStatus.connected).then(() => history.goBack());
    };
    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>
                            Save
                        </IonButton>
                        <IonButton onClick={handleDelete}>
                            Delete
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonInput className="inputField" placeholder="Nume" value={nume} onIonChange={e => setNume(e.detail.value || '')}/>
                <IonInput className="inputField" placeholder="Prenume" value={prenume} onIonChange={e => setPrenume(e.detail.value || '')} />
                <IonInput className="inputField" placeholder="Telefon" value={telefon} onIonChange={e => setTelefon(e.detail.value || '')}/>
                <IonRadioGroup allowEmptySelection={false} value={ocupatie} onIonChange={e => setOcupatie(e.detail.value)}>
                    <IonListHeader>
                        <IonLabel>Select Group: </IonLabel>
                    </IonListHeader>
                    <IonItem>
                        <IonLabel>Not set</IonLabel>
                        <IonRadio slot="end" color="primary" value="Not set" ></IonRadio>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Favourites</IonLabel>
                        <IonRadio slot="end" color="primary" value="Favourites"></IonRadio>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Family</IonLabel>
                        <IonRadio slot="end" color="primary" value="Family"></IonRadio>
                    </IonItem>

                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save Person'}</div>
                )}</IonRadioGroup></IonContent>
        </IonPage>
    );
};

export default PersonEdit;
