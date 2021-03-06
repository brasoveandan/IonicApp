import React, { useContext, useEffect, useState } from 'react';
import {
    IonActionSheet,
    IonButton,
    IonButtons,
    IonContent, IonFab, IonFabButton,
    IonHeader, IonIcon,
    IonInput, IonItem, IonLabel, IonListHeader,
    IonLoading,
    IonPage, IonRadio, IonRadioGroup,
    IonTitle,
    IonToolbar,
    IonImg, createAnimation
} from '@ionic/react';
import { getLogger } from '../core';
import { PersonContext } from './PersonProvider';
import { RouteComponentProps } from 'react-router';
import { PersonProps } from './PersonProps';
import {useNetwork} from "../utils/useNetwork";
import {camera, close, trash} from "ionicons/icons";
import { Photo, usePhotoGallery } from "../utils/usePhotoGallery";
import {MyMap} from "../utils/MyMap";

const log = getLogger('PersonEdit');

interface PersonEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const PersonEdit: React.FC<PersonEditProps> = ({ history, match }) => {
    const { persons, saving, savingError, savePerson, deletePerson } = useContext(PersonContext);
    const [nume, setNume] = useState('');
    const [prenume, setPrenume] = useState('');
    const [telefon, setTelefon] = useState('');
    const [ocupatie, setOcupatie] = useState('');
    const [photoPath, setPhotoPath] = useState('');
    const [latitude, setLatitude] = useState(46.22000169197405);
    const [longitude, setLongitude] = useState(24.118391152210002);
    const [person, setPerson] = useState<PersonProps>();
    const { networkStatus } = useNetwork();
    const {photos, takePhoto, deletePhoto } = usePhotoGallery();
    const [photoToDelete, setPhotoToDelete] = useState<Photo>();

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
            setPhotoPath(person.photoPath);
            if (person.latitude) setLatitude(person.latitude);
            if (person.longitude) setLongitude(person.longitude);
        }
    }, [match.params.id, persons]);

    const handleSave = () => {
        const editedPerson = person
            ? {
            ...person,
                nume,
                prenume,
                telefon,
                ocupatie,
                status: 0,
                photoPath,
                latitude,
                longitude
        }
        : {
                nume,
                prenume,
                telefon,
                ocupatie,
                status: 0,
                photoPath,
                latitude,
                longitude
            };
        savePerson && savePerson(editedPerson,networkStatus.connected).then(() => { history.goBack(); })
    };

    const handleDelete = () => {
        const editPerson = person
            ? {
                ...person,
                nume,
                prenume,
                telefon,
                ocupatie,
                status: 0,
                photoPath,
                latitude,
                longitude
            }
            : {
                nume,
                prenume,
                telefon,
                ocupatie,
                status: 0,
                photoPath,
                latitude,
                longitude
            };
        deletePerson && deletePerson(editPerson,networkStatus.connected).then(() => history.goBack());
    }

    function chainAnimations() {
        const label1 = document.querySelector('.label1');
        const label2 = document.querySelector('.label2');
        const label3 = document.querySelector('.label3');
        const elem2 = document.querySelector('.group');
        if (label1 && label2 && label3 && elem2) {
            const animation1 = createAnimation()
                .addElement(Array.of(label1, label2, label3))
                .duration(100)
                .direction("alternate")
                .iterations(3)
                .fromTo('transform', 'rotate(0)', 'rotate(20deg)')
                .fromTo('transform', 'rotate(20deg)', 'rotate(0)');

            const animation2= createAnimation()
                .addElement(elem2)
                .duration(500)
                .fromTo('transform', 'scale(1)', 'scale(0.9)');
            (async () => {
               await animation1.play();
               await animation2.play();
            })();
        }
    }
    useEffect(chainAnimations, []);

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
                <IonItem>
                    <div className="label1"><IonLabel>First Name:</IonLabel></div>
                    <IonInput
                        className="inputField"
                        placeholder="Nume"
                        value={nume}
                        onIonChange={e => setNume(e.detail.value || '')}/>
                </IonItem>
                <IonItem>
                    <div className="label2"><IonLabel>Last Name:</IonLabel></div>
                    <IonInput
                        className="inputField"
                        placeholder="Prenume"
                        value={prenume}
                        onIonChange={e => setPrenume(e.detail.value || '')}/>
                </IonItem>
                <IonItem>
                    <div className="label3"><IonLabel>Phone:</IonLabel>
                    </div>
                    <IonInput
                        className="inputField"
                        placeholder="Telefon"
                        value={telefon}
                        onIonChange={e => setTelefon(e.detail.value || '')}/>
                </IonItem>
                <div className="group"> <IonRadioGroup allowEmptySelection={false} value={ocupatie}
                                     onIonChange={e => setOcupatie(e.detail.value)}>
                    <IonListHeader>
                        <IonLabel>Select Group: </IonLabel>
                    </IonListHeader>
                    <IonItem>
                        <IonLabel>Not set</IonLabel>
                        <IonRadio slot="end" color="primary" value="Not set"></IonRadio>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Favourites</IonLabel>
                        <IonRadio slot="end" color="primary" value="Favourites"></IonRadio>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Family</IonLabel>
                        <IonRadio slot="end" color="primary" value="Family"></IonRadio>
                    </IonItem>

                    <IonLoading isOpen={saving}/>
                    {savingError && (
                        <div>{savingError.message || 'Failed to save Person'}</div>
                    )}
                </IonRadioGroup>
                </div>

                <IonImg
                    style={{width: "500px", height: "500px", margin: "0 auto"}}
                    onClick={() => {setPhotoToDelete(photos?.find(item => item.webviewPath === photoPath))}}
                    alt={"No photo"}
                    src={photoPath}
                />
                <MyMap
                    lat={latitude}
                    lng={longitude}
                    onMapClick={(location: any) => {
                        setLatitude(location.latLng.lat());
                        setLongitude(location.latLng.lng());
                    }}
                />
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton
                        onClick={() => {
                            const photoTaken = takePhoto();
                            photoTaken.then((data) => {
                                setPhotoPath(data.webviewPath!);
                            });
                        }}
                    >
                        <IonIcon icon={camera}/>
                    </IonFabButton>
                </IonFab>
                <IonActionSheet
                    isOpen={!!photoToDelete}
                    buttons={[
                        {
                            text: "Delete",
                            role: "destructive",
                            icon: trash,
                            handler: () => {
                                if (photoToDelete) {
                                    deletePhoto(photoToDelete);
                                    setPhotoToDelete(undefined);
                                    setPhotoPath("")
                                }
                            },
                        },
                        {
                            text: "Cancel",
                            icon: close,
                            role: "cancel",
                        },
                    ]}
                    onDidDismiss={() => setPhotoToDelete(undefined)}
                />
            </IonContent>
        </IonPage>
    );
};

export default PersonEdit;
