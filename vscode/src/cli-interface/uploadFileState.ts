export async function uploadFileState(file: string) {
  if (!file) {
    console.warn("No file path provided. Skipping FileUpdate.");
    return;
  }

  const body = {
    jsonrpc: "2.0",
    method: "FileUpdate",
    params: { file },
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
      console.warn(`❌ Failed to send FileUpdate: ${res.status} - ${errMsg}`);
    } else {
      console.log(`📤 Sent FileUpdate via HTTP: ${file}`);
    }
  } catch (err) {
    console.error("❌ Error sending FileUpdate:", err);
  }
}
