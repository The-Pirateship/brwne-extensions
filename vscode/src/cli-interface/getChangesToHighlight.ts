export function startPollingForChanges(filepath: string) {
  const poll = async () => {
    await getChangesToHighlight(filepath);
  };

  // First run immediately, then every 5 seconds
  poll(); 
  return setInterval(poll, 5000);
}

async function getChangesToHighlight(filepath: string) {
  if (!filepath) {
    console.warn("No filepath provided. Skipping getChangesToHighlight.");
    return;
  }

  const body = {
    jsonrpc: "2.0",
    method: "ChangesRequest",
    params: { filepath },
    id: Date.now(), // or any unique ID
  };

  try {
    const res = await fetch(`http://localhost:${process.env.LOCAL_SERVER_PORT}/extcomms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errMsg = await res.text();
      console.warn(`❌ Failed to send request for Changes: ${res.status} - ${errMsg}`);
    } else {
      console.log(`📤 Sent Request for changes via HTTP: ${filepath}`);
      const data = await res.json()
      console.log(`⚡️ Recieved response: ${JSON.stringify(data)}`);

    }
  } catch (err) {
    console.error("❌ Error sending request for changes:", err);
  }
}
