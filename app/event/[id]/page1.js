"use client";

import React, { useEffect, useState } from "react"; // 1. 確保引入 React
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  deleteDoc,
  doc
} from "firebase/firestore";

import { db } from "../../../lib/firebase";

export default function EventPage({ params }) {
  // 2. 使用 React.use() 拆開 Promise 包裹並取得 eventId
  const unwrappedParams = React.use(params);
  const eventId = unwrappedParams.id;

  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [memberName, setMemberName] = useState("");

  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemWeight, setItemWeight] = useState("");
  const [itemBuyer, setItemBuyer] = useState("");

  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseType, setExpenseType] = useState("weight");

  useEffect(() => {
    // 3. 為了防範邊緣錯誤，先確保 eventId 存在才建立監聽
    if (!eventId) return;

    const unsubMembers = onSnapshot(
      query(collection(db, "events", eventId, "members")),
      snapshot => {
        setMembers(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
    );

    const unsubItems = onSnapshot(
      query(collection(db, "events", eventId, "items")),
      snapshot => {
        setItems(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
    );

    const unsubExpenses = onSnapshot(
      query(collection(db, "events", eventId, "expenses")),
      snapshot => {
        setExpenses(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }
    );

    return () => {
      unsubMembers();
      unsubItems();
      unsubExpenses();
    };
  }, [eventId]); // 4. 當 eventId 改變時會重新出發監聽

  async function addMember() {
    if (!memberName || !eventId) return;

    await addDoc(collection(db, "events", eventId, "members"), {
      name: memberName
    });

    setMemberName("");
  }

  async function addItem() {
    if (!itemName || !itemPrice || !itemWeight || !itemBuyer || !eventId) return;

    await addDoc(collection(db, "events", eventId, "items"), {
      name: itemName,
      price: Number(itemPrice),
      weight: Number(itemWeight),
      buyer: itemBuyer
    });

    setItemName("");
    setItemPrice("");
    setItemWeight("");
  }

  async function addExpense() {
    if (!expenseName || !expenseAmount || !eventId) return;

    await addDoc(collection(db, "events", eventId, "expenses"), {
      name: expenseName,
      amount: Number(expenseAmount),
      type: expenseType
    });

    setExpenseName("");
    setExpenseAmount("");
  }

  async function removeItem(id) {
    if (!eventId) return;
    await deleteDoc(doc(db, "events", eventId, "items", id));
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div>
      <h1>📦 團購明細</h1>

      <div style={{ background: "white", padding: 20, borderRadius: 10, marginBottom: 20 }}>
        <h2>👥 成員</h2>

        <input
          placeholder="成員名稱"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
        />

        <button onClick={addMember}>新增成員</button>

        <ul>
          {members.map(member => (
            <li key={member.id}>{member.name}</li>
          ))}
        </ul>
      </div>

      <div style={{ background: "white", padding: 20, borderRadius: 10, marginBottom: 20 }}>
        <h2>🛒 商品</h2>

        <input placeholder="商品名稱" value={itemName} onChange={(e)=>setItemName(e.target.value)} />
        <input placeholder="價格" type="number" value={itemPrice} onChange={(e)=>setItemPrice(e.target.value)} />
        <input placeholder="重量" type="number" value={itemWeight} onChange={(e)=>setItemWeight(e.target.value)} />

        <select value={itemBuyer} onChange={(e)=>setItemBuyer(e.target.value)}>
          <option value="">選擇購買人</option>

          {members.map(member => (
            <option key={member.id} value={member.name}>
              {member.name}
            </option>
          ))}
        </select>

        <button onClick={addItem}>新增商品</button>

        {items.map(item => (
          <div key={item.id} style={{ marginTop: 10 }}>
            {item.name} / ${item.price} / {item.weight}kg / {item.buyer}

            <button onClick={() => removeItem(item.id)}>
              刪除
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: "white", padding: 20, borderRadius: 10, marginBottom: 20 }}>
        <h2>🚚 額外支出</h2>

        <input placeholder="名稱" value={expenseName} onChange={(e)=>setExpenseName(e.target.value)} />
        <input placeholder="金額" type="number" value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} />

        <select value={expenseType} onChange={(e)=>setExpenseType(e.target.value)}>
          <option value="weight">依重量分攤</option>
          <option value="equal">平均分攤</option>
        </select>

        <button onClick={addExpense}>新增支出</button>

        {expenses.map(expense => (
          <div key={expense.id} style={{ marginTop: 10 }}>
            {expense.name} / ${expense.amount} / {expense.type}
          </div>
        ))}
      </div>

      <div style={{ background: "white", padding: 20, borderRadius: 10 }}>
        <h2>💰 結算</h2>

        {members.map(member => {
          const memberItems = items.filter(i => i.buyer === member.name);

          const itemTotal = memberItems.reduce((sum, i) => sum + i.price, 0);

          const memberWeight = memberItems.reduce((sum, i) => sum + i.weight, 0);

          let weightExpense = 0;
          let equalExpense = 0;

          expenses.forEach(expense => {
            if (expense.type === "weight") {
              if (totalWeight > 0) {
                weightExpense += expense.amount * (memberWeight / totalWeight);
              }
            } else {
              equalExpense += expense.amount / members.length;
            }
          });

          const total = itemTotal + weightExpense + equalExpense;

          return (
            <div
              key={member.id}
              style={{
                background: "#eef4ff",
                padding: 15,
                borderRadius: 10,
                marginBottom: 10
              }}
            >
              <h3>{member.name}</h3>

              <p>商品總額：${itemTotal.toFixed(0)}</p>
              <p>重量分攤：${weightExpense.toFixed(0)}</p>
              <p>平均分攤：${equalExpense.toFixed(0)}</p>

              <h2>應付：${total.toFixed(0)}</h2>
            </div>
          );
        })}
      </div>
    </div>
  );
}