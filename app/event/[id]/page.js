"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function EventPage({ params }) {
  const unwrappedParams = React.use(params);
  const eventId = unwrappedParams.id;

  // 基礎資料狀態
  const [eventName, setEventName] = useState("載入中...");
  const [cnyRate, setCnyRate] = useState(4.5); // 人民幣匯率預設 4.5
  const [shippingRate, setShippingRate] = useState(12); // 每公斤運費預設 ¥12
  
  // 列表資料狀態
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // 表單輸入狀態
  const [memberName, setMemberName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemWeight, setItemWeight] = useState("");
  const [itemBuyer, setItemBuyer] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseType, setExpenseType] = useState("weight");

  // 1. 監聽主事件文件（讀取與同步 匯率、運費設定）
  useEffect(() => {
    if (!eventId) return;
    const eventRef = doc(db, "events", eventId);
    
    const unsubEvent = onSnapshot(eventRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEventName(data.name || "未命名團購");
        if (data.cnyRate !== undefined) setCnyRate(data.cnyRate);
        if (data.shippingRate !== undefined) setShippingRate(data.shippingRate);
      }
    });

    return () => unsubEvent();
  }, [eventId]);

  // 2. 監聽子集合（成員、商品、額外支出）
  useEffect(() => {
    if (!eventId) return;

    const unsubMembers = onSnapshot(query(collection(db, "events", eventId, "members")), snapshot => {
      setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubItems = onSnapshot(query(collection(db, "events", eventId, "items")), snapshot => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubExpenses = onSnapshot(query(collection(db, "events", eventId, "expenses")), snapshot => {
      setExpenses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubMembers();
      unsubItems();
      unsubExpenses();
    };
  }, [eventId]);

  // 3. 修改匯率與運費並同步到 Firebase
  const handleUpdateSettings = async (rate, shipping) => {
    if (!eventId) return;
    await updateDoc(doc(db, "events", eventId), {
      cnyRate: Number(rate),
      shippingRate: Number(shipping)
    });
  };

  // 4. 資料操作功能
  async function addMember() {
    if (!memberName || !eventId) return;
    await addDoc(collection(db, "events", eventId, "members"), { name: memberName });
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
    setItemName(""); setItemPrice(""); setItemWeight("");
  }

  async function addExpense() {
    if (!expenseName || !expenseAmount || !eventId) return;
    await addDoc(collection(db, "events", eventId, "expenses"), {
      name: expenseName,
      amount: Number(expenseAmount),
      type: expenseType
    });
    setExpenseName(""); setExpenseAmount("");
  }

  async function removeItem(id) {
    await deleteDoc(doc(db, "events", eventId, "items", id));
  }

  // 5. 計算總重量
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px", fontFamily: "system-ui, sans-serif", backgroundColor: "#f4f6f9", minHeight: "100vh", boxSizing: "border-box" }}>
      
      {/* 頂部導覽列 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button onClick={() => window.location.href = "/"} style={{ padding: "8px 16px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          🔙 返回主頁
        </button>
        <h1 style={{ margin: 0, color: "#333", fontSize: "28px" }}>📦 {eventName}</h1>
      </div>

      {/* ⚡ 核心設定主控制台 */}
      <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "15px", boxSizing: "border-box" }}>
        <div>
          <label style={{ display: "block", fontSize: "14px", color: "#666", marginBottom: "5px", fontWeight: "bold" }}>台幣/人民幣匯率 (TWD/CNY)</label>
          <input type="number" step="0.01" value={cnyRate} onChange={(e) => { setCnyRate(e.target.value); handleUpdateSettings(e.target.value, shippingRate); }} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "14px", color: "#666", marginBottom: "5px", fontWeight: "bold" }}>每公斤運費 (¥ CNY)</label>
          <input type="number" value={shippingRate} onChange={(e) => { setShippingRate(e.target.value); handleUpdateSettings(cnyRate, e.target.value); }} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
        </div>
        <div style={{ backgroundColor: "#fff3cd", padding: "12px", borderRadius: "8px", border: "1px solid #ffeeba", boxSizing: "border-box" }}>
          <span style={{ display: "block", fontSize: "12px", color: "#856404", fontWeight: "bold" }}>📊 當前物流狀態總計</span>
          <span style={{ fontSize: "18px", fontWeight: "bold", color: "#856404" }}>總重量：{totalWeight.toFixed(2)} kg</span>
          {totalWeight > 0 && totalWeight < 10 && <div style={{ fontSize: "12px", color: "#dc3545", marginTop: "4px", fontWeight: "bold" }}>⚠️ 不足 10kg，全團自動加收 ¥20 派送費</div>}
        </div>
      </div>

      {/* 下方主要操作區塊 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        
        {/* 卡片 1：成員管理 */}
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", boxSizing: "border-box" }}>
          <h2 style={{ marginTop: 0, fontSize: "18px", color: "#0056b3", borderBottom: "2px solid #eef2f7", paddingBottom: "10px" }}>👥 參與成員</h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input placeholder="輸入成員名稱" value={memberName} onChange={(e) => setMemberName(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
            <button onClick={addMember} style={{ padding: "10px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>新增</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {members.map(m => (
              <span key={m.id} style={{ backgroundColor: "#e1f5fe", color: "#0288d1", padding: "6px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold" }}>{m.name}</span>
            ))}
          </div>
        </div>

        {/* 卡片 2：新增代購商品（已修正寬度超出問題） */}
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", boxSizing: "border-box" }}>
          <h2 style={{ marginTop: 0, fontSize: "18px", color: "#28a745", borderBottom: "2px solid #eef2f7", paddingBottom: "10px" }}>🛒 登記商品 (¥ 人民幣)</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "15px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input placeholder="商品名稱" value={itemName} onChange={(e)=>setItemName(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              <select value={itemBuyer} onChange={(e)=>setItemBuyer(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}>
                <option value="">選擇購買人</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input placeholder="價格 (¥)" type="number" value={itemPrice} onChange={(e)=>setItemPrice(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              <input placeholder="重量 (kg)" type="number" value={itemWeight} onChange={(e)=>setItemWeight(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
            </div>
          </div>
          
          <button onClick={addItem} style={{ width: "100%", padding: "12px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" }}>新增商品明細</button>

          <div style={{ marginTop: "15px", maxHeight: "250px", overflowY: "auto", borderTop: "1px solid #eee", paddingTop: "10px" }}>
            {items.length === 0 && <div style={{ color: "#999", textAlign: "center", padding: "15px", fontSize: "14px" }}>尚未新增商品</div>}
            {items.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px", marginBottom: "8px", fontSize: "14px", boxSizing: "border-box" }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: "#333" }}>{item.name}</strong> <span style={{ color: "#666", fontSize: "12px" }}>({item.buyer})</span>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>¥{item.price} ({item.weight}kg) ➜ NT$ {(item.price * cnyRate).toFixed(0)}</div>
                </div>
                <button onClick={() => removeItem(item.id)} style={{ backgroundColor: "#dc3545", color: "white", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>刪除</button>
              </div>
            ))}
          </div>
        </div>

        {/* 卡片 3：台灣本地雜費（已修正寬度超出問題） */}
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", boxSizing: "border-box" }}>
          <h2 style={{ marginTop: 0, fontSize: "18px", color: "#fd7e14", borderBottom: "2px solid #eef2f7", paddingBottom: "10px" }}>🚚 台灣在地費用 (NT$ 外部支出)</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "15px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input placeholder="項目 (如:台灣店到店)" value={expenseName} onChange={(e)=>setExpenseName(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              <input placeholder="金額 (NT$)" type="number" value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
            </div>
            <select value={expenseType} onChange={(e)=>setExpenseType(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}>
              <option value="weight">依集運重量比例分攤</option>
              <option value="equal">按參與人頭平攤</option>
            </select>
          </div>
          <button onClick={addExpense} style={{ width: "100%", padding: "10px", backgroundColor: "#fd7e14", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>新增額外費用</button>
        </div>

      </div>

      {/* 🎯 最終全自動換算結算報表（全面改為全新要求的「每人獨立精準運費」邏輯） */}
      <div style={{ marginTop: "30px", backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.08)", boxSizing: "border-box" }}>
        <h2 style={{ marginTop: 0, color: "#343a40", borderBottom: "3px solid #007bff", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>💰 最終自動結算報表 (新台幣 NT$)</span>
          <span style={{ fontSize: "14px", color: "#666", fontWeight: "normal" }}>
            總重量: {totalWeight.toFixed(2)} kg 
            {totalWeight > 0 && totalWeight < 10 ? " (⚠️未滿 10kg 已包含平攤 ¥20)" : ""}
          </span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "15px", marginTop: "15px" }}>
          {members.map(member => {
            const memberItems = items.filter(i => i.buyer === member.name);
            const itemTotalCNY = memberItems.reduce((sum, i) => sum + i.price, 0);
            const itemTotalTWD = itemTotalCNY * cnyRate; 
            const memberWeight = memberItems.reduce((sum, i) => sum + i.weight, 0);

            // 1. ✅ 每個人自己獨立計算專屬基礎運費 = 個人重量 × 每公斤運費(CNY) × 匯率(TWD)
            const memberBaseShippingTWD = memberWeight * shippingRate * cnyRate;

            // 2. ✅ 整筆訂單只加一次的「未滿 10kg +¥20」罰金，依重量權重比例攤到個人身上
            let memberSurchargeTWD = 0;
            if (totalWeight > 0 && totalWeight < 10) {
              const totalSurchargeTWD = 20 * cnyRate;
              memberSurchargeTWD = totalSurchargeTWD * (memberWeight / totalWeight);
            }

            // 3. 完美的個人專屬國際運費總額
            const memberTotalShippingTWD = memberBaseShippingTWD + memberSurchargeTWD;

            // 4. 計算台灣本地雜費分攤
            let localExpenseTWD = 0;
            expenses.forEach(exp => {
              if (exp.type === "weight") {
                if (totalWeight > 0) localExpenseTWD += exp.amount * (memberWeight / totalWeight);
              } else {
                localExpenseTWD += exp.amount / members.length;
              }
            });

            // 5. 最終帳單完美統一轉為台幣加總
            const finalMemberTotal = itemTotalTWD + memberTotalShippingTWD + localExpenseTWD;

            return (
              <div key={member.id} style={{ background: "#f8f9fa", padding: "15px", borderRadius: "10px", borderLeft: "5px solid #007bff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", boxSizing: "border-box" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#007bff", fontSize: "18px" }}>{member.name}</h3>
                <div style={{ fontSize: "14px", color: "#555", lineHeight: "1.6" }}>
                  <div>🛒 商品金額：<span style={{ float: "right", fontWeight: "500" }}>NT$ {itemTotalTWD.toFixed(0)}</span></div>
                  <div style={{ fontSize: "11px", color: "#999", textAlign: "right", marginBottom: "4px" }}>(原幣計: ¥{itemTotalCNY})</div>
                  
                  {/* 精確且名目清晰的集運欄位 */}
                  <div>✈️ 國際集運：<span style={{ float: "right", fontWeight: "500" }}>NT$ {memberTotalShippingTWD.toFixed(0)}</span></div>
                  <div style={{ fontSize: "11px", color: "#999", textAlign: "right", marginBottom: "4px" }}>
                    ({memberWeight.toFixed(2)}kg × ¥{shippingRate} {memberSurchargeTWD > 0 ? `+ 罰金 NT$${memberSurchargeTWD.toFixed(0)}` : ""})
                  </div>
                  
                  <div>🏡 在地雜費：<span style={{ float: "right", fontWeight: "500" }}>NT$ {localExpenseTWD.toFixed(0)}</span></div>
                  <hr style={{ border: 0, borderTop: "1px dashed #ccc", margin: "10px 0" }} />
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#dc3545" }}>應付總計：<span style={{ float: "right" }}>NT$ {finalMemberTotal.toFixed(0)}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}