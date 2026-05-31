const form = document.getElementById('form');
const statusBox = document.getElementById('status');
const resultBox = document.getElementById('result');
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  resultBox.innerHTML = '';
  statusBox.textContent = 'Processing video... wait, the machines are finally being supervised.';
  const btn = form.querySelector('button'); btn.disabled = true;
  try{
    const data = new FormData(form);
    const res = await fetch('/analyze', {method:'POST', body:data});
    const json = await res.json();
    if(!res.ok){ throw new Error(json.error || 'Analysis failed'); }
    const riskClass = json.collision_risk.toLowerCase();
    resultBox.innerHTML = `
      <h2>Analysis Result</h2>
      <p><b>Collision Risk:</b> <span class="badge ${riskClass}">${json.collision_risk}</span></p>
      <p><b>Lane Status:</b> ${json.lane_status}</p>
      <p><b>Driver Status:</b> ${json.driver_status}</p>
      <p><b>Alert Required:</b> ${json.alert_required ? 'YES' : 'NO'}</p>
      <p><b>Processed Frames:</b> ${json.processed_frames}</p>
      <p><b>Processing Time:</b> ${json.processing_seconds} seconds</p>
      <p><b>Detected Objects:</b> ${Object.keys(json.detected_objects).length ? JSON.stringify(json.detected_objects) : 'No major road objects detected'}</p>
      <p><a href="${json.output_video}" target="_blank">Open Processed Output Video</a></p>`;
    statusBox.textContent = 'Analysis completed.';
  }catch(err){
    statusBox.textContent = 'Error: ' + err.message;
  }finally{ btn.disabled = false; }
});
