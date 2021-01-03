import React, {useState} from 'react';
import { IonItem, IonLabel, createAnimation, IonModal, IonButton } from '@ionic/react';
import { PersonProps } from './PersonProps';
import {
    IonImg,
} from '@ionic/react';

interface PersonPropsExt extends PersonProps {
    onEdit: (id?: string) => void;
}

const Person: React.FC<PersonPropsExt> = ({ _id, nume, prenume, telefon, ocupatie, photoPath, onEdit }) => {
    const [showModal, setShowModal] = useState(false);

    const enterAnimation = (baseEl: any) => {
        const backdropAnimation = createAnimation()
            .addElement(baseEl.querySelector("ion-backdrop")!)
            .fromTo("opacity", "0.01", "var(--backdrop-opacity)");

        const wrapperAnimation = createAnimation()
            .addElement(baseEl.querySelector(".modal-wrapper")!)
            .keyframes([
                { offset: 0, opacity: "0", transform: "scale(0)" },
                { offset: 1, opacity: "0.99", transform: "scale(1)" },
            ]);

        return createAnimation()
            .addElement(baseEl)
            .easing("ease-out")
            .duration(500)
            .addAnimation([backdropAnimation, wrapperAnimation]);
    };

    const leaveAnimation = (baseEl: any) => {
        return enterAnimation(baseEl).direction("reverse");
    };

    return (
        <IonItem>
            <IonLabel onClick={() => onEdit(_id)}>{nume}</IonLabel>
            {/*<IonLabel>{prenume}</IonLabel>*/}
            <IonLabel onClick={() => onEdit(_id)}>{nume}>{telefon}</IonLabel>
            <IonLabel onClick={() => onEdit(_id)}>{nume}>{ocupatie}</IonLabel>
            <IonLabel>
                <IonImg
                    style={{width: "100px"}}
                    alt={"No Photo"}
                    src={photoPath}
                    onClick={() => {setShowModal(true);}}
                />
            </IonLabel>
            <IonModal
                isOpen={showModal}
                enterAnimation={enterAnimation}
                leaveAnimation={leaveAnimation}
            >
                <IonImg
                    alt={"No Photo"}
                    src={photoPath}
                    onClick={() => {setShowModal(true);}}
                />
                <IonButton onClick={() => setShowModal(false)}>Close Image</IonButton>
            </IonModal>
        </IonItem>
    );
};

export default Person;
