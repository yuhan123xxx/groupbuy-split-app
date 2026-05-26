"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc
} from "firebase/firestore";

import { db } from "../lib/firebase";

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });

    return () => unsub();
  }, []);

  async function createEvent() {
    if (!name) return;

    await addDoc(collection(db, "events"), {
      name,
      createdAt: Date.now()
    });

    setName("");
  }

  async function removeEvent(id) {
    await deleteDoc(doc(db, "events", id));
  }

  return (
    <div>
      <h1>🛒 團購拆帳工具</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="輸入團購名稱"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10, marginRight: 10 }}
        />

        <button onClick={createEvent}>建立團購</button>
      </div>

      {events.map(event => (
        <div
          key={event.id}
          style={{
            background: "white",
            padding: 20,
            borderRadius: 10,
            marginBottom: 10
          }}
        >
          <h3>{event.name}</h3>

          <a href={`/event/${event.id}`}>
            進入團購
          </a>

          <button
            onClick={() => removeEvent(event.id)}
            style={{ marginLeft: 10 }}
          >
            刪除
          </button>
        </div>
      ))}
    </div>
  );
}