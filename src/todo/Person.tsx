import React from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import { PersonProps } from './PersonProps';

interface PersonPropsExt extends PersonProps {
    onEdit: (id?: string) => void;
}

const Person: React.FC<PersonPropsExt> = ({ _id, nume, prenume, telefon, ocupatie, photoPath, onEdit }) => {
    return (
        <IonItem onClick={() => onEdit(_id)}>
            <IonLabel>{nume}</IonLabel>
            <IonLabel>{prenume}</IonLabel>
            <IonLabel>{telefon}</IonLabel>
            <IonLabel>{ocupatie}</IonLabel>
            <IonLabel><img alt={nume + "Photo"} src={photoPath}/></IonLabel>
        </IonItem>
    );
};

export default Person;
