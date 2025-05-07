// // Placeholder for Google API initialization and authentication
// // Implement functions to:
// // - List Google Sheets accessible to the user
// // - List tabs within the selected sheet
// // - Append scanned QR code data to the selected sheet and tab

// // QR Code scanning functionality
// function onScanSuccess(decodedText, decodedResult) {
//     document.getElementById('beep').play();
//     // Append decodedText to the selected Google Sheet tab
//     console.log(`QR Code detected: ${decodedText}`);
//     // Implement the logic to send data to Google Sheets
//   }
  
//   // Initialize QR Code scanner
//   function initializeScanner() {
//     const html5QrCode = new Html5Qrcode("reader");
//     html5QrCode.start(
//       { facingMode: "environment" },
//       {
//         fps: 10,
//         qrbox: 250
//       },
//       onScanSuccess
//     ).catch(err => {
//       console.error(`Unable to start scanning, error: ${err}`);
//     });
//   }
  
//   // Call initializeScanner when on scanner.html
//   if (window.location.pathname.endsWith('scanner.html')) {
//     initializeScanner();
//   }
  
//   gapi.auth2.init({
//     client_id: '869840812429-if1d4ee7d2lukokgl3t6seu8659r69t1.apps.googleusercontent.com',
//     scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly'
//   });

let accessToken;
let selectedSheetId;
let selectedSheetName;

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('signin-button').addEventListener('click', handleAuthClick);
  document.getElementById('start-scan').addEventListener('click', startScanner);
  document.getElementById('Select sheet').addEventListener('change', fetchSheetTabs);
  document.getElementById('Select Tab').addEventListener('change', e => selectedSheetName = e.target.value);
});

function handleAuthClick() {
  google.accounts.oauth2.initTokenClient({
    client_id: '869840812429-if1d4ee7d2lukokgl3t6seu8659r69t1.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets',
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      gapi.load('client', initClient);
    }
  }).requestAccessToken();
}

function initClient() {
  gapi.client.init({
    apiKey: 'AIzaSyD5Bp3twofaLWWP1t6JGyjR69Y4GnSr37U',
    discoveryDocs: [
      'https://sheets.googleapis.com/$discovery/rest?version=v4',
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
    ]
  }).then(() => {
    listGoogleSheets();
  });
}

function listGoogleSheets() {
  gapi.client.drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed = false",
    fields: "files(id, name)"
  }).then(response => {
    const dropdown = document.getElementById('sheetsDropdown');
    dropdown.innerHTML = '<option disabled selected>Select a sheet</option>';
    response.result.files.forEach(file => {
      const option = document.createElement('option');
      option.value = file.id;
      option.textContent = file.name;
      dropdown.appendChild(option);
    });
  });
}

function fetchSheetTabs(e) {
  selectedSheetId = e.target.value;
  gapi.client.sheets.spreadsheets.get({
    spreadsheetId: selectedSheetId
  }).then(response => {
    const dropdown = document.getElementById('tabsDropdown');
    dropdown.innerHTML = '<option disabled selected>Select a tab</option>';
    response.result.sheets.forEach(sheet => {
      const option = document.createElement('option');
      option.value = sheet.properties.title;
      option.textContent = sheet.properties.title;
      dropdown.appendChild(option);
    });
  });
}

function startScanner() {
  const scanner = new Html5Qrcode("reader");
  scanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: 250
    },
    qrCodeMessage => {
      scanner.stop();
      beep();
      sendToSheet(qrCodeMessage);
    }
  ).catch(err => console.error("QR scanner failed:", err));
}

function beep() {
  const beepAudio = new Audio('beep.mp3'); // Ensure you have beep.mp3 in your directory
  beepAudio.play();
}

function sendToSheet(data) {
  const values = [[new Date().toISOString(), data]];
  gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: selectedSheetId,
    range: `${selectedSheetName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: { values }
  }).then(() => {
    alert("QR code added to sheet!");
  }).catch(err => {
    console.error("Failed to write to sheet:", err);
    alert("Failed to add QR to sheet.");
  });
}
