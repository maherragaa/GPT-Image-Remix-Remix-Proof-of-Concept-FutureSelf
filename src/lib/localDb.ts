import localforage from 'localforage';

export const db = localforage.createInstance({ name: 'FutureSelfDB' });
export const storage = localforage.createInstance({ name: 'FutureSelfStorage' });

export function doc(dbInstance: any, collectionPath: string, docId: string) {
  return { collectionPath, docId };
}

export function collection(dbInstance: any, collectionPath: string) {
  return { collectionPath, type: 'collection' };
}

export function query(collectionRef: any, ...constraints: any[]) {
  return { collectionRef, constraints };
}

export function where(field: string, op: string, value: any) {
  return { field, op, value };
}

// Simple pub-sub for onSnapshot
const listeners: Record<string, Function[]> = {};

function triggerListeners(collectionPath: string) {
  if (listeners[collectionPath]) {
    getDocs(collection({}, collectionPath)).then((docs) => {
      listeners[collectionPath].forEach(cb => cb({ docs }));
    });
  }
}

function triggerDocListeners(collectionPath: string, docId: string) {
    if (listeners[`${collectionPath}/${docId}`]) {
        getDoc(doc({}, collectionPath, docId)).then(docSnap => {
            listeners[`${collectionPath}/${docId}`].forEach(cb => cb(docSnap));
        })
    }
}

export async function setDoc(docRef: { collectionPath: string, docId: string }, data: any, options?: { merge: boolean }) {
  const allDocs: Record<string, any> = (await db.getItem(docRef.collectionPath)) || {};
  if (options?.merge && allDocs[docRef.docId]) {
    allDocs[docRef.docId] = { ...allDocs[docRef.docId], ...data };
  } else {
    allDocs[docRef.docId] = data;
  }
  await db.setItem(docRef.collectionPath, allDocs);
  triggerListeners(docRef.collectionPath);
  triggerDocListeners(docRef.collectionPath, docRef.docId);
}

export async function updateDoc(docRef: { collectionPath: string, docId: string }, data: any) {
  return setDoc(docRef, data, { merge: true });
}

export async function getDoc(docRef: { collectionPath: string, docId: string }) {
  const allDocs: Record<string, any> = (await db.getItem(docRef.collectionPath)) || {};
  const data = allDocs[docRef.docId];
  return {
    exists: () => !!data,
    data: () => data
  };
}

export async function deleteDoc(docRef: { collectionPath: string, docId: string }) {
  const allDocs: Record<string, any> = (await db.getItem(docRef.collectionPath)) || {};
  delete allDocs[docRef.docId];
  await db.setItem(docRef.collectionPath, allDocs);
  triggerListeners(docRef.collectionPath);
  triggerDocListeners(docRef.collectionPath, docRef.docId);
}

export function writeBatch(dbInstance: any) {
  return {
    delete: async (docRef: any) => {
       await deleteDoc(docRef);
    },
    commit: async () => {} // we are just awaiting deleteDoc individually for now to mock it
  }
}

export function orderBy(field: string, direction: string) {
  return { type: 'orderBy', field, direction };
}

export async function getDocs(queryRef: any) {
    const collPath = queryRef.collectionPath || queryRef.collectionRef?.collectionPath;
    const allDocs: Record<string, any> = (await db.getItem(collPath)) || {};

    let docsList = Object.keys(allDocs).map(id => ({ 
        id, 
        data: () => allDocs[id],
        ref: { collectionPath: collPath, docId: id } // mock ref for writeBatch.delete
    }));

    if (queryRef.constraints) {
        for (const constraint of queryRef.constraints) {
            if (constraint.op === '==') {
                docsList = docsList.filter(d => d.data()[constraint.field] === constraint.value);
            }
        }
    }
    
    // Sort by createdAt descending implicitly for our app
    docsList.sort((a: any, b: any) => {
       const da = a.data().createdAt ? new Date(a.data().createdAt).getTime() : 0;
       const dbTime = b.data().createdAt ? new Date(b.data().createdAt).getTime() : 0;
       return dbTime - da;
    });

    return docsList;
}

// Mock auth
export const auth = {
  get currentUser() {
    let localUserStr = localStorage.getItem('localUser_sync');
    if (localUserStr) {
      return JSON.parse(localUserStr);
    }
    return {
      uid: 'local_user_1',
      isAnonymous: false,
      email: 'local@user.com'
    };
  }
};


export function onSnapshot(ref: any, callback: Function) {
    if (ref.docId) {
        // Document reference
        const path = `${ref.collectionPath}/${ref.docId}`;
        if (!listeners[path]) listeners[path] = [];
        listeners[path].push(callback);
        // initial trigger
        getDoc(ref).then(doc => callback(doc));
        return () => {
             listeners[path] = listeners[path].filter(cb => cb !== callback);
        };
    } else {
        // Query / Collection reference
        const collPath = ref.collectionPath || ref.collectionRef?.collectionPath;
        if (!listeners[collPath]) listeners[collPath] = [];
        listeners[collPath].push((payload: any) => {
            // Re-run the query
            getDocs(ref).then(docs => {
                payload.docs = docs;
                payload.forEach = (cb: any) => payload.docs.forEach(cb);
                callback(payload);
            });
        });
        
        // initial trigger
        getDocs(ref).then(docs => callback({ 
            docs,
            forEach: (cb: any) => docs.forEach(cb)
        }));
        return () => {
             listeners[collPath] = listeners[collPath].filter(cb => cb !== callback);
        };
    }
}

// Storage mock
export function ref(storageInstance: any, path: string) {
  return path;
}

export async function uploadString(storageRef: string, dataUrl: string, format: string) {
  await storage.setItem(storageRef, dataUrl);
}

export async function getDownloadURL(storageRef: string): Promise<string> {
  return await storage.getItem(storageRef) as string || "";
}
