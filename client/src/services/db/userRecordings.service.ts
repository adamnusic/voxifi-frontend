import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.service";

export const createUserRecording = async () => {
  const userRecording = collection(db, "user-recordings");
  const docRef = await addDoc(userRecording, {
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};
