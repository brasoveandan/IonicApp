import React from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import { PersonProps } from './PersonProps';

interface PersonPropsExt extends PersonProps {
    onEdit: (id?: string) => void;
}

const Person: React.FC<PersonPropsExt> = ({ id, nume, prenume, telefon, ocupatie, onEdit }) => {
    return (
        <IonItem onClick={() => onEdit(id)}>
            <IonLabel>{nume}</IonLabel>
            <IonLabel>{prenume}</IonLabel>
            <IonLabel>{telefon}</IonLabel>
            <IonLabel>{ocupatie}</IonLabel>
        </IonItem>
    );
};

export default Person;
