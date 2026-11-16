# Bank DApp Assignment 7 · Infura Sepolia

1. แตก ZIP แล้วเปิด Terminal ในโฟลเดอร์ที่มี `index.html`
2. รัน `python3 -m http.server 8000` (Windows ใช้ `py -m http.server 8000`) แล้วเปิด <http://localhost:8000>
3. กรอก Infura API Key ที่เปิดใช้ Ethereum Sepolia และกรอก Contract Address เดิมจาก Remix
4. กด **เชื่อมต่อ MetaMask** เลือกบัญชีเดิมบน **Ethereum Sepolia** แล้วกด **รีเฟรชยอดเงิน**

ยอดเงินเดิมจะปรากฏเมื่อใช้ Contract Address และบัญชีเดิมบน Sepolia ส่วนการฝากและถอนต้องยืนยันใน MetaMask

หน้าเว็บส่งคำขออ่านยอดไปยัง Infura โดยตรงและเก็บ API Key ในช่องกรอกของหน้าเว็บระหว่างใช้งาน เมื่อโหลดหน้าใหม่ให้กรอก Key อีกครั้ง ใช้ API Key เท่านั้นและเก็บ API Key Secret ไว้ฝั่งเซิร์ฟเวอร์
