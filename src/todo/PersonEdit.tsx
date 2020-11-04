import React, { useContext, useEffect, useState } from 'react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { getLogger } from '../core';
import { PersonContext } from './PersonProvider';
import { RouteComponentProps } from 'react-router';
import { PersonProps } from './PersonProps';

const log = getLogger('PersonEdit');

interface PersonEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const PersonEdit: React.FC<PersonEditProps> = ({ history, match }) => {
    const { persons, saving, savingError, savePerson } = useContext(PersonContext);
    const [nume, setNume] = useState('');
    const [prenume, setPrenume] = useState('');
    const [telefon, setTelefon] = useState('');
    const [ocupatie, setOcupatie] = useState('');
    const [person, setPerson] = useState<PersonProps>();
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const person = persons?.find(it => it.id === routeId);
        setPerson(person);
        if (person) {
            setNume(person.nume);
            setPrenume(person.prenume);
            setTelefon(person.telefon);
            setOcupatie(person.ocupatie);
        }
    }, [match.params.id, persons]);
    const handleSave = () => {
        const editedPerson = person ? { ...person, nume, prenume, telefon, ocupatie } : { nume, prenume, telefon, ocupatie };
        savePerson && savePerson(editedPerson).then(() => history.goBack());
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
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonInput className="inputField" placeholder="Nume" value={nume} onIonChange={e => setNume(e.detail.value || '')}/>
                <IonInput className="inputField" placeholder="Prenume" value={prenume} onIonChange={e => setPrenume(e.detail.value || '')} />
                <IonInput className="inputField" placeholder="Telefon" value={telefon} onIonChange={e => setTelefon(e.detail.value || '')}/>
                <IonInput className="inputField" placeholder="Ocupatie" value={ocupatie} onIonChange={e => setOcupatie(e.detail.value || '')} />
                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save Person'}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default PersonEdit;
