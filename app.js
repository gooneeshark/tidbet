// Matrix background effect
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

const letters = "アイウエオカキクケコサシスセソタチツテトナニヌネノ";
const fontSize = 16;
let columns = canvas.width / fontSize;
let drops = [];

for (let x = 0; x < columns; x++) drops[x] = 1;

function draw() {
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = fontSize + "px monospace";
  for (let i = 0; i < drops.length; i++) {
    const text = letters.charAt(Math.floor(Math.random() * letters.length));
    // rainbow gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "red");
    gradient.addColorStop(0.2, "orange");
    gradient.addColorStop(0.4, "yellow");
    gradient.addColorStop(0.6, "green");
    gradient.addColorStop(0.8, "blue");
    gradient.addColorStop(1, "violet");
    ctx.fillStyle = gradient;

    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

window.addEventListener('resize', () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  columns = canvas.width / fontSize;
  drops = [];
  for (let x = 0; x < columns; x++) drops[x] = 1;
});

setInterval(draw, 50);

// Load shortcuts from JSON
async function loadShortcuts() {
  try {
    const response = await fetch('https://googem.netlify.app/card.json');
    const data = await response.json();
    const container = document.getElementById('shortcutsContainer');
    
    data.sites.forEach(site => {
      const shortcut = document.createElement('div');
      shortcut.className = 'shortcut';
      shortcut.innerHTML = `
        <a href="${site.url}" target="_blank" rel="noopener noreferrer">
          <div class="shortcut-icon">
            <img src="${site.image || site.logo || `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=128`}" 
                 alt="${site.name}"
                 onerror="this.src='https://googem.netlify.app/public/logo/default.webp'">
          </div>
          <div class="shortcut-name">${site.name}</div>
        </a>
      `;
      container.appendChild(shortcut);
    });
  } catch (error) {
    console.error('Error loading shortcuts:', error);
  }
}

// Load shortcuts on page load
loadShortcuts();

// Search functionality
document.getElementById('searchInput').addEventListener('input', function(e) {
  const searchTerm = e.target.value.toLowerCase();
  const shortcuts = document.querySelectorAll('.shortcut');
  
  shortcuts.forEach(shortcut => {
    const name = shortcut.querySelector('.shortcut-name').textContent.toLowerCase();
    if (name.includes(searchTerm)) {
      shortcut.style.display = 'flex';
    } else {
      shortcut.style.display = 'none';
    }
  });
});

// Chat functionality
const chatWidget = document.getElementById('chatWidget');
const chatPanel = document.getElementById('chatPanel');
const closeChat = document.getElementById('closeChat');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const typingIndicator = document.getElementById('typingIndicator');

let isChatOpen = false;
let isLoading = false;

chatWidget.addEventListener('click', () => {
  isChatOpen = !isChatOpen;
  chatPanel.style.display = isChatOpen ? 'flex' : 'none';
  if (isChatOpen) {
    chatInput.focus();
  }
});

closeChat.addEventListener('click', () => {
  isChatOpen = false;
  chatPanel.style.display = 'none';
});

chatInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && !isLoading) {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.textContent = message;
    chatMessages.appendChild(userMsg);
    
    chatInput.value = '';
    isLoading = true;
    typingIndicator.style.display = 'block';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
      // Check for API Key
      const apiKey = localStorage.getItem('gemnee_api_key');
      if (!apiKey) {
        throw new Error('กรุณาใส่ API Key ก่อนคุยด้วยกูเจมนี่!');
      }
      
      // Call AI API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: message }]
          }]
        })
      });
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]) {
        const botText = data.candidates[0].content.parts[0].text;
        
        // Add bot message
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';
        botMsg.textContent = botText;
        chatMessages.appendChild(botMsg);
      } else {
        throw new Error('ไม่ได้รับการตอบกลับจาก AI');
      }
    } catch (error) {
      // Add error message
      const errorMsg = document.createElement('div');
      errorMsg.className = 'message bot';
      errorMsg.textContent = '❌ ' + error.message;
      chatMessages.appendChild(errorMsg);
    } finally {
      isLoading = false;
      typingIndicator.style.display = 'none';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
});

// Add shortcut functionality
const addBtn = document.getElementById('addBtn');
const shortcutModal = document.getElementById('shortcutModal');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const shortcutName = document.getElementById('shortcutName');
const shortcutUrl = document.getElementById('shortcutUrl');

addBtn.addEventListener('click', () => {
  shortcutModal.style.display = 'flex';
});

cancelBtn.addEventListener('click', () => {
  shortcutModal.style.display = 'none';
  shortcutName.value = '';
  shortcutUrl.value = '';
});

submitBtn.addEventListener('click', () => {
  const name = shortcutName.value.trim();
  const url = shortcutUrl.value.trim();
  
  if (name && url) {
    try {
      // Validate URL
      new URL(url);
      
      const container = document.getElementById('shortcutsContainer');
      const shortcut = document.createElement('div');
      shortcut.className = 'shortcut';
      
      // Extract domain for favicon
      const domain = new URL(url).hostname;
      
      shortcut.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer">
          <div class="shortcut-icon">
            <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=128" 
                 alt="${name}"
                 onerror="this.src='https://googem.netlify.app/public/logo/default.webp'">
          </div>
          <div class="shortcut-name">${name}</div>
        </a>
      `;
      container.appendChild(shortcut);
      
      // Save to localStorage
      const userShortcuts = JSON.parse(localStorage.getItem('user_shortcuts') || '[]');
      userShortcuts.push({ name, url });
      localStorage.setItem('user_shortcuts', JSON.stringify(userShortcuts));
      
      shortcutModal.style.display = 'none';
      shortcutName.value = '';
      shortcutUrl.value = '';
    } catch (error) {
      alert('URL ไม่ถูกต้อง! กรุณาใส่ URL ที่ถูกต้องเช่น https://example.com');
    }
  }
});

// Background change functionality
const bgBtn = document.getElementById('bgBtn');
const bgModal = document.getElementById('bgModal');
const submitBgBtn = document.getElementById('submitBgBtn');
const cancelBgBtn = document.getElementById('cancelBgBtn');
const resetBgBtn = document.getElementById('resetBgBtn');
const bgFile = document.getElementById('bgFile');

bgBtn.addEventListener('click', () => {
  bgModal.style.display = 'flex';
});

cancelBgBtn.addEventListener('click', () => {
  bgModal.style.display = 'none';
  bgFile.value = '';
});

resetBgBtn.addEventListener('click', () => {
  localStorage.removeItem('custom_bg');
  document.body.style.backgroundImage = '';
  document.body.style.background = 'black';
  bgModal.style.display = 'none';
  bgFile.value = '';
});

submitBgBtn.addEventListener('click', () => {
  const file = bgFile.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const bgUrl = e.target.result;
      localStorage.setItem('custom_bg', bgUrl);
      document.body.style.backgroundImage = `url(${bgUrl})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      bgModal.style.display = 'none';
      bgFile.value = '';
    };
    reader.readAsDataURL(file);
  }
});

// Load custom background on page load
const customBg = localStorage.getItem('custom_bg');
if (customBg) {
  document.body.style.backgroundImage = `url(${customBg})`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
  document.body.style.backgroundRepeat = 'no-repeat';
} else {
  document.body.style.background = 'black';
}

// Load user shortcuts from localStorage
function loadUserShortcuts() {
  const userShortcuts = JSON.parse(localStorage.getItem('user_shortcuts') || '[]');
  const container = document.getElementById('shortcutsContainer');
  
  userShortcuts.forEach(shortcut => {
    const shortcutEl = document.createElement('div');
    shortcutEl.className = 'shortcut';
    
    // Extract domain for favicon
    const domain = new URL(shortcut.url).hostname;
    
    shortcutEl.innerHTML = `
      <a href="${shortcut.url}" target="_blank" rel="noopener noreferrer">
        <div class="shortcut-icon">
          <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=128" 
               alt="${shortcut.name}"
               onerror="this.src='https://googem.netlify.app/public/logo/default.webp'">
        </div>
        <div class="shortcut-name">${shortcut.name}</div>
      </a>
    `;
    container.appendChild(shortcutEl);
  });
}

loadUserShortcuts();

// Check for API Key on startup
if (!localStorage.getItem('gemnee_api_key')) {
  // Show API Key setup modal
  const apiKeyModal = document.createElement('div');
  apiKeyModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  apiKeyModal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; width: 90%;">
      <h2 style="color: #f97316; margin-bottom: 15px;">🔑 ใส่ API Key ของคุณ</h2>
      <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
        ไปขอ API Key ฟรีจาก <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #f97316;">Google AI Studio</a> แล้วนำมาใส่ที่นี่
      </p>
      <input type="password" id="apiKeyInput" placeholder="วาง API Key ของคุณที่นี่..." 
             style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px;">
      <button id="saveApiKey" style="background: #f97316; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; width: 100%;">
        เริ่มใช้งานกูเจมนี่!
      </button>
    </div>
  `;
  
  document.body.appendChild(apiKeyModal);
  
  document.getElementById('saveApiKey').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (apiKey) {
      localStorage.setItem('gemnee_api_key', apiKey);
      document.body.removeChild(apiKeyModal);
    }
  });
}
