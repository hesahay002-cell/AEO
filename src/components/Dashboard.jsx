<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Safal Admin | Safal Academy Live</title>
    <style>
        /* ================= BASIC DASHBOARD CSS ================= */
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
        .navbar { display: flex; justify-content: space-between; align-items: center; background-color: #ffffff; padding: 15px 30px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .logo-area h2 { margin: 0; color: #1a73e8; font-size: 24px; }
        .logo-area span { font-size: 12px; color: #666; letter-spacing: 1px; text-transform: uppercase; }
        .nav-buttons { display: flex; gap: 10px; }
        .nav-btn { padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; background-color: #f1f3f4; font-weight: 600; color: #333; transition: 0.2s; }
        .nav-btn:hover { background-color: #e8eaed; }
        .nav-btn.active { background-color: #1a73e8; color: white; }
        .whatsapp-btn { background-color: #25D366; color: white; }
        .whatsapp-btn:hover { background-color: #1ebe57; }
        
        .container { padding: 30px; max-width: 1200px; margin: auto; }
        .tab-content { display: none; } /* Tabs by default hide rahenge */
        .tab-content.active { display: block; } /* Sirf active tab dikhega */
        
        .card-container { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px; }
        h3 { margin-top: 0; color: #111b21; font-size: 22px; }
        p.subtitle { color: #667781; font-size: 14px; margin-top: -10px; margin-bottom: 20px; }

        /* Forms & Inputs */
        input[type="text"], select, textarea { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
        .btn-primary { background: #1a73e8; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; }
        .btn-success { background: #0f9d58; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; }
        .btn-dark { background: #202124; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; }
        
        /* Grid Layout for Resources */
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .grid-box { border: 1px solid #eee; padding: 20px; border-radius: 8px; background: #fafafa; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border-bottom: 1px solid #eee; padding: 12px; text-align: left; font-size: 14px; }
        th { background: #f8f9fa; color: #555; }

        /* ================= WHATSAPP UI CSS ================= */
        .wa-container { display: flex; height: 75vh; background: #ece5dd; border: 1px solid #ccc; border-radius: 8px; overflow: hidden; font-family: 'Segoe UI', Helvetica Neue, Helvetica, Arial, sans-serif; }
        .wa-sidebar { width: 35%; background: #ffffff; border-right: 1px solid #ddd; display: flex; flex-direction: column; }
        .wa-header { background: #f0f2f5; padding: 15px; font-weight: bold; border-bottom: 1px solid #ddd; font-size: 16px; color: #111b21; }
        .wa-search { padding: 10px; background: #f6f6f6; border-bottom: 1px solid #ddd; }
        .wa-search input { width: 100%; padding: 8px 15px; border-radius: 8px; border: none; outline: none; background: #ffffff; box-sizing: border-box; }
        .wa-contact-list { overflow-y: auto; flex-grow: 1; }
        .wa-contact { padding: 12px 15px; border-bottom: 1px solid #f2f2f2; cursor: pointer; transition: 0.2s; }
        .wa-contact:hover { background: #f5f6f6; }
        .wa-chat-area { width: 65%; display: flex; flex-direction: column; background: #efeae2; background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); opacity: 0.95; }
        .wa-messages { flex-grow: 1; overflow-y: auto; padding: 30px; display: flex; flex-direction: column; gap: 8px; }
        .msg-bubble { max-width: 70%; padding: 8px 12px; border-radius: 8px; font-size: 14px; position: relative; box-shadow: 0 1px 1px rgba(0,0,0,0.1); line-height: 1.5; color: #111b21; }
        .msg-in { background: #ffffff; align-self: flex-start; border-top-left-radius: 0; }
        .msg-out { background: #d9fdd3; align-self: flex-end; border-top-right-radius: 0; }
        .msg-time { display: block; font-size: 11px; color: #667781; text-align: right; margin-top: 4px; }
    </style>
</head>
<body>

    <!-- NAVBAR -->
    <div class="navbar">
        <div class="logo-area">
            <h2>Safal Admin</h2>
            <span>Safal Academy Live - Vaidehi CRM</span>
        </div>
        <!-- FIX: onclick function mein 'this' pass kiya gaya hai -->
        <div class="nav-buttons">
            <button class="nav-btn" onclick="showTab('attendance', this)">Attendance</button>
            <button class="nav-btn" onclick="showTab('fee-manager', this)">Fee Manager</button>
            <button class="nav-btn" onclick="showTab('bulk-message', this)">Bulk Message</button>
            <button class="nav-btn" onclick="showTab('enquiries', this)">Enquiries</button>
            <button class="nav-btn active" onclick="showTab('resources', this)">Resources</button>
            <!-- NAYA WHATSAPP BUTTON -->
            <button class="nav-btn whatsapp-btn" onclick="showTab('whatsapp-view', this); loadWhatsAppChats();">💬 Live WhatsApp</button>
        </div>
    </div>

    <!-- MAIN DASHBOARD AREA -->
    <div class="container">
        
        <!-- 1. ATTENDANCE -->
        <div id="attendance" class="tab-content">
            <div class="card-container">
                <h3>Attendance Dashboard</h3>
                <p class="subtitle">Student attendance logs and alerts.</p>
                <!-- Yahan aapka attendance code ayega -->
            </div>
        </div>

        <!-- 2. FEE MANAGER -->
        <div id="fee-manager" class="tab-content">
            <div class="card-container">
                <h3>Fee Manager</h3>
                <p class="subtitle">Track pending fees and send reminders.</p>
            </div>
        </div>

        <!-- 3. BULK MESSAGE -->
        <div id="bulk-message" class="tab-content">
            <div class="card-container">
                <h3>Bulk Messaging System</h3>
                <p class="subtitle">Send notices to all students at once.</p>
            </div>
        </div>

        <!-- 4. ENQUIRIES (Vaidehi Prompt) -->
        <div id="enquiries" class="tab-content">
            <h3>Admission enquiries</h3>
            <p class="subtitle">Review questions received by the Safal Academy WhatsApp bot.</p>
            
            <div class="card-container">
                <h4>🧠 Vaidehi AI Brain (System Prompt)</h4>
                <textarea rows="4" id="ai-prompt" placeholder="Vaidehi ki instructions yahan likhein..."></textarea>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="width: auto;">✔ Update Vaidehi</button>
                    <button class="btn-dark" style="width: auto;">↻ Reload Current Prompt</button>
                </div>
            </div>

            <div class="card-container">
                <h4>Student Enquiry Database</h4>
                <table>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Class</th>
                        <th>Course</th>
                        <th>Board</th>
                        <th>Last Enquiry</th>
                    </tr>
                    <tr><td colspan="6" style="text-align:center; color:#888;">Unlock and click Refresh to load data.</td></tr>
                </table>
            </div>
        </div>

        <!-- 5. RESOURCES (Active by default) -->
        <div id="resources" class="tab-content active">
            <h3>Resource Manager</h3>
            <p class="subtitle">Manage study materials, links, and games for Vaidehi.</p>
            
            <div class="grid-3">
                <!-- Academics -->
                <div class="grid-box">
                    <h5 style="color: #666; margin-top: 0;">ACADEMICS</h5>
                    <h4>Upload Study Material</h4>
                    <select><option>Select Class...</option></select>
                    <input type="text" placeholder="Subject (e.g. Math, Physics)">
                    <select><option>Material Type...</option></select>
                    <input type="text" placeholder="Google Drive Link (PDF)">
                    <button class="btn-primary">Save Material</button>
                </div>

                <!-- Marketing & Media -->
                <div class="grid-box">
                    <h5 style="color: #666; margin-top: 0;">MARKETING & MEDIA</h5>
                    <h4>Institute Links</h4>
                    <label style="font-size: 12px; color: #666;">Website URL</label>
                    <input type="text" placeholder="https://safalacademy.in">
                    <label style="font-size: 12px; color: #666;">Google Maps Location</label>
                    <input type="text" placeholder="Maps Link">
                    <label style="font-size: 12px; color: #666;">Latest Result Poster Link</label>
                    <input type="text" placeholder="Drive/Imgur Image Link">
                    <button class="btn-dark">Update Links</button>
                </div>

                <!-- Fun & Learn -->
                <div class="grid-box">
                    <h5 style="color: #666; margin-top: 0;">FUN & LEARN</h5>
                    <h4>Add Educational Game</h4>
                    <p style="font-size: 12px; color: #666;">Aapke banaye gaye games yahan add karein taki bot inhe bacchon ko bhej sake.</p>
                    <input type="text" placeholder="Game Name (e.g. Math Quiz)">
                    <input type="text" placeholder="Game URL Link">
                    <button class="btn-success">Save Game</button>
                </div>
            </div>

            <div class="card-container" style="margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4>Vaidehi's Knowledge Base (Saved Resources)</h4>
                    <button class="btn-primary" style="width: auto; padding: 5px 15px;">↻ Refresh</button>
                </div>
                <table>
                    <tr><th>Category</th><th>Details</th><th>Link</th><th>Action</th></tr>
                    <tr><td colspan="4" style="text-align:center; color:#888;">No resources found.</td></tr>
                </table>
            </div>
        </div>

        <!-- 6. WHATSAPP CHAT INTERFACE (Naya Feature) -->
        <div id="whatsapp-view" class="tab-content" style="padding: 0; background: transparent; box-shadow: none;">
            <div class="wa-container">
                <!-- Left Sidebar (Numbers List) -->
                <div class="wa-sidebar">
                    <div class="wa-header">Safal Live Chats</div>
                    <div class="wa-search">
                        <input type="text" id="wa-search-input" placeholder="Number search karein..." onkeyup="filterWaChats()">
                    </div>
                    <div class="wa-contact-list" id="wa-contact-list">
                        <div style="padding: 20px; text-align: center; color: #666; font-size: 14px;">Chats load ho rahe hain...</div>
                    </div>
                </div>
                <!-- Right Area (Messages Viewer) -->
                <div class="wa-chat-area">
                    <div class="wa-header" id="wa-chat-title">Messages dekhne ke liye left side se kisi contact par click karein.</div>
                    <div class="wa-messages" id="wa-messages">
                        <!-- Chat bubbles yahan aayenge -->
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- JAVASCRIPT LOGIC -->
    <script>
        // FIX: Tab Switch Karne Ka Theek Logic (Ab buttons kaam karenge)
        function showTab(tabId, clickedBtn) {
            // Sabhi tabs aur buttons se 'active' class hatayein
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            
            // Jisko click kiya usko active banayein
            document.getElementById(tabId).classList.add('active');
            if(clickedBtn) {
                clickedBtn.classList.add('active');
            }
        }

        // ================= WHATSAPP CHAT LOGIC =================
        let waGlobalConversations = [];
        const DASHBOARD_KEY = '525077'; // Aapka secure password

        // Backend se chat history load karna
        async function loadWhatsAppChats() {
            try {
                document.getElementById('wa-contact-list').innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">Chats load ho rahe hain...</div>`;
                const response = await fetch('/api/conversations', {
                    headers: { 'x-admin-key': DASHBOARD_KEY }
                });
                const data = await response.json();
                if(data.success) {
                    waGlobalConversations = data.conversations;
                    renderWaContacts();
                } else {
                    document.getElementById('wa-contact-list').innerHTML = `<div style="padding: 20px; color: red;">Error: Chats fetch nahi hue.</div>`;
                }
            } catch (err) {
                console.error("Failed to load chats:", err);
                document.getElementById('wa-contact-list').innerHTML = `<div style="padding: 20px; color: red;">Network error. Server check karein.</div>`;
            }
        }

        // Left sidebar mein contacts/numbers dikhana
        function renderWaContacts() {
            const list = document.getElementById('wa-contact-list');
            list.innerHTML = '';
            
            if(waGlobalConversations.length === 0) {
                list.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">Koi chat history nahi mili.</div>`;
                return;
            }

            waGlobalConversations.forEach((chat, index) => {
                const lastMsg = chat.messages[chat.messages.length - 1];
                let textPreview = lastMsg ? String(lastMsg.text).substring(0, 35) + '...' : 'No messages';
                
                let timeStr = "";
                if (lastMsg && lastMsg.timestamp) {
                    let timeObj = new Date(lastMsg.timestamp._seconds ? lastMsg.timestamp._seconds * 1000 : lastMsg.timestamp);
                    timeStr = timeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                }
                
                list.innerHTML += `
                    <div class="wa-contact" onclick="openWaChat(${index})">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <strong style="color: #111b21;">${chat.phone}</strong>
                            <span style="font-size: 12px; color: #667781;">${timeStr}</span>
                        </div>
                        <div style="font-size: 13px; color: #667781;">${textPreview}</div>
                    </div>
                `;
            });
        }

        // Kisi number par click karne par uski poori chat open karna
        function openWaChat(index) {
            const chat = waGlobalConversations[index];
            document.getElementById('wa-chat-title').innerText = "Chat with " + chat.phone;
            
            const msgArea = document.getElementById('wa-messages');
            msgArea.innerHTML = '';
            
            if(!chat.messages || chat.messages.length === 0) {
                msgArea.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;">No messages found.</div>`;
                return;
            }

            chat.messages.forEach(m => {
                let isOut = (m.direction === 'outgoing'); 
                let bubbleClass = isOut ? 'msg-out' : 'msg-in';
                
                let timeStr = "";
                if (m.timestamp) {
                    let timeObj = new Date(m.timestamp._seconds ? m.timestamp._seconds * 1000 : m.timestamp);
                    timeStr = timeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                }
                
                let safeText = String(m.text || "").replace(/\n/g, '<br>');

                msgArea.innerHTML += `
                    <div class="msg-bubble ${bubbleClass}">
                        ${safeText}
                        <span class="msg-time">${timeStr}</span>
                    </div>
                `;
            });
            
            // Auto scroll to bottom
            setTimeout(() => {
                msgArea.scrollTop = msgArea.scrollHeight;
            }, 50);
        }

        // Search bar logic
        function filterWaChats() {
            const term = document.getElementById('wa-search-input').value.toLowerCase();
            const contacts = document.querySelectorAll('.wa-contact');
            contacts.forEach(c => {
                const text = c.innerText.toLowerCase();
                c.style.display = text.includes(term) ? 'block' : 'none';
            });
        }
    </script>
</body>
</html>
