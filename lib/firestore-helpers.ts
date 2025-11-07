import { firestore } from './firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore'// Helper function to get a document by ID
export async function getDocumentById<T = DocumentData>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(firestore, collectionName, id)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T
  }
  return null
}

// Helper function to get all documents from a collection
export async function getAllDocuments<T = DocumentData>(collectionName: string): Promise<T[]> {
  const collectionRef = collection(firestore, collectionName)
  const snapshot = await getDocs(collectionRef)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
}

// Helper function to query documents
export async function queryDocuments<T = DocumentData>(
  collectionName: string, 
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const collectionRef = collection(firestore, collectionName)
  const q = query(collectionRef, ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
}

// Helper function to create or update a document
export async function setDocument(collectionName: string, id: string, data: any): Promise<void> {
  const docRef = doc(firestore, collectionName, id)
  await setDoc(docRef, data, { merge: true })
}

// Helper function to update a document
export async function updateDocument(collectionName: string, id: string, data: any): Promise<void> {
  const docRef = doc(firestore, collectionName, id)
  await updateDoc(docRef, data)
}

// Helper function to delete a document
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const docRef = doc(firestore, collectionName, id)
  await deleteDoc(docRef)
}

// Export firestore query helpers for direct use
export { collection, doc, getDoc, getDocs, query, where, orderBy, limit }
