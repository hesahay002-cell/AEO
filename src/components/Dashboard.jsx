<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Safal Admin | Safal Academy Live</title>
    <style>
        /* ================= BASIC DASHBOARD CSS ================= */
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
        
        /* Navbar */
        .navbar { display: flex; justify-content: space-between; align-items: center; background-color: #ffffff; padding: 15px 30px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); position: relative; z-index: 10; height: 70px; box-sizing: border-box; }
        .logo-area h2 { margin: 0; color: #1a73e8; font-size: 24px; }
        .logo-area span { font-size: 12px; color: #666; letter-spacing: 1px; text-transform: uppercase; }
        .nav-buttons { display: flex; gap: 10px; }
        .nav-btn { padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; background-color: #f1f3f4; font-weight: 600; color: #333; transition: 0.2s; }
        .nav-btn:hover { background-color: #e8eaed; }
        .nav-btn.active { background-color: #1a73e8; color: white; }
        
        /* WhatsApp Button Special Styling */
        .whatsapp-btn { background-color: #25D366; color: white; margin-left: 10px; }
        .whatsapp-btn:hover { background-color: #1ebe57; }
        .whatsapp-btn.active { background-color: #075e54; color: white; }
        
        /* Layouts */
        .container { padding: 30px; max-width: 1200px; margin: auto; }
        
        /* Tab Logic */
        .tab-content { display: none; } 
        .tab-content.active { display: block; }
        
        /* Cards & Forms */
        .card-container { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px; }
        h3 { margin-top: 0; color: #111b21; font-size: 22px; }
        p.subtitle { color: #667781; font-size: 14px; margin-top: -10px; margin-bottom: 20px; }
        input[type="text"], select, textarea { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
        .btn-primary { background: #1a73e8; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .btn-success { background: #0f9d58; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .btn-dark { background: #202124; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        
        /* Grid */
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .grid-box { border: 1px solid #eee; padding: 20px; border-radius: 8px; background: #fafafa; }
        
        /* Tables */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border-bottom: 1px solid #eee; padding: 12px; text-align: left; font-size: 14px; }
        th { background: #f8f9fa; color: #555; }

        /* ================= FULL SCREEN WHATSAPP UI CSS ================= */
        /* Changed from boxed layout to 100% width and height */
        .wa-container { display: flex; height: calc(100vh - 70px); width: 100vw; background: #ece5dd; font-family: 'Segoe UI', Helvetica Neue, Helvetica, Arial, sans-serif; overflow: hidden; }
        .wa-sidebar { width: 35%; max-width: 450px; background: #ffffff; border-right: 1px solid #ddd; display: flex; flex-direction: column; }
        .wa-header { background: #f0f2f5; padding: 15px; font-weight: bold; border-bottom: 1px solid #ddd; font-size: 16px; color: #111b21; }
        .wa-search { padding: 10px; background: #f6f6f6; border-bottom: 1px solid #ddd; }
        .wa-search input { width: 100%; padding: 8px 15px; border-radius: 8px; border: none; outline: none; background: #ffffff; box-sizing: border-box; }
        .wa-contact-list { overflow-y: auto; flex-grow: 1; }
        .wa-contact { padding: 12px 15px; border-bottom: 1px solid #f2f2f2; cursor: pointer; transition: 0.2s; }
        .wa-contact:hover { background: #f5f6f6; }
        .wa-chat-area { flex-grow: 1; display: flex; flex-direction: column; background: #efeae2; background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); opacity: 0.95; }
        .wa-messages { flex-grow: 1; overflow-y: auto; padding: 40px 8%; display: flex; flex-direction: column; gap: 8px; }
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
        <div class="nav-buttons">
            <!-- Buttons for switching tabs -->
            <button class="nav-btn" onclick="showTab('attendance', this)">Attendance</button>
            <button class="nav-btn" onclick="showTab('fee-manager', this)">Fee Manager</button>
            <button class="nav-btn" onclick="showTab('bulk-message', this)">Bulk Message</button>
            <button class="nav-btn" onclick="showTab('enquiries', this)">Enquiries</button>
            
            <!-- Default active button -->
            <button class="nav-btn active" onclick="showTab('resources', this)">Resources</button>
            
            <!-- NAYA WHATSAPP BUTTON -->
            <button class="nav-btn whatsapp-btn" onclick="showTab('whatsapp-view', this); loadWhatsAppChats();">💬 Live WhatsApp</button>
        </div>
    </div>

    <!-- MAIN DASHBOARD AREA (Limited Width - Used for all tabs except WhatsApp) -->
    <div class="container" id="main-container">
        
        <!-- 1. ATTENDANCE TAB -->
        <div id="attendance" class="tab-content">
            <div class="card-container">
                <h3>Attendance Dashboard</h3>
                <p class="subtitle">Student attendance logs and alerts.</p>
            </div>
        </div>

        <!-- 2. FEE MANAGER TAB -->
        <div id="fee-manager" class="tab-content">
            <div class="card-container">
                <h3>Fee Manager</h3>
                <p class="subtitle">Track pending fees and send reminders.</p>
            </div>
        </div>

        <!-- 3. BULK MESSAGE TAB -->
        <div id="bulk-message" class="tab-content">
            <div class="card-container">
                <h3>Bulk Messaging System</h3>
                <p class="subtitle">Send notices to all students at once.</p>
            </div>
        </div>

        <!-- 4. ENQUIRIES TAB (Vaidehi Prompt Box) -->
        <div id="enquiries" class="tab-content">
            <h3>Admission enquiries</h3>
            <p class="subtitle">Review questions received by the Safal Academy WhatsApp bot.</p>
            
            <div class="card-container">
                <h4>🧠 Vaidehi AI Brain (System Prompt)</h4>
                <textarea rows="4" id="ai-prompt" placeholder="Vaidehi ki instructions yahan likhein..."></textarea>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary">✔ Update Vaidehi</button>
                    <button class="btn-dark">↻ Reload Current Prompt</button>
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

        <!-- 5. RESOURCES TAB (Active by default) -->
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
                    <button class="btn-primary" style="width: 100%;">Save Material</button>
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
                    <button class="btn-dark" style="width: 100%;">Update Links</button>
                </div>

                <!-- Fun & Learn -->
                <div class="grid-box">
                    <h5 style="color: #666; margin-top: 0;">FUN & LEARN</h5>
                    <h4>Add Educational Game</h4>
                    <p style="font-size: 12px; color: #666;">Aapke banaye gaye games yahan add karein.</p>
                    <input type="text" placeholder="Game Name (e.g. Math Quiz)">
                    <input type="text" placeholder="Game URL Link">
                    <button class="btn-success" style="width: 100%;">Save Game</button>
                </div>
            </div>

            <div class="card-container" style="margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4>Vaidehi's Knowledge Base (Saved Resources)</h4>
                    <button class="btn-primary" style="padding: 5px 15px;">↻ Refresh</button>
                </div>
                <table>
                    <tr><th>Category</th><th>Details</th><th>Link</th><th>Action</th></tr>
                    <tr><td colspan="4" style="text-align:center; color:#888;">No resources found.</td></tr>
                </table>
            </div>
        </div>
    </div> <!-- End of standard max-width container -->

    <!-- 6. WHATSAPP CHAT INTERFACE TAB (Full Width - Kept outside standard container) -->
    <div id="whatsapp-view" class="tab-content" style="display: none;">
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

    <!-- JAVASCRIPT LOGIC -->
    <script>
        // ================= TAB SWITCHING LOGIC =================
        function showTab(tabId, clickedBtn) {
            // 1. Sabhi tab content ko hide karein
            const allTabs = document.querySelectorAll('.tab-content');
            allTabs.forEach(tab => tab.classList.remove('active'));
            
            // 2. Sabhi navbar buttons se 'active' color hatayein
            const allBtns = document.querySelectorAll('.nav-btn');
            allBtns.forEach(btn => btn.classList.remove('active'));
            
            // 3. Jis button aur tab par click hua hai, use show/active karein
            document.getElementById(tabId).classList.add('active');
            if (clickedBtn) {
                clickedBtn.classList.add('active');
            }

            // 4. 🔥 Full Screen Logic 🔥
            if (tabId === 'whatsapp-view') {
                // WhatsApp active hone par 1200px wale container ko chupa dein
                document.getElementById('main-container').style.display = 'none';
                document.body.style.overflow = 'hidden'; // Scrolling band taaki chat perfectly fit ho
            } else {
                // Baaki tabs ke liye purana layout wapas layein
                document.getElementById('main-container').style.display = 'block';
                document.body.style.overflow = 'auto'; // Scrolling wapas chalu
            }
        }

        // ================= WHATSAPP CHAT LOGIC =================
        let waGlobalConversations = [];
        const DASHBOARD_KEY = '525077'; 

        async function loadWhatsAppChats() {
            try {
                document.getElementById('wa-contact-list').innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">Chats load ho rahe hain...</div>`;
                
                const response = await fetch('/api/conversations', {
                    headers: { 'x-admin-key': DASHBOARD_KEY }
                });
                
                const data = await response.json();
