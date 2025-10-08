const verifyToken = process.env.TEMPORARY_ACCESS_TOKEN;

// webhook.controller.js
export const verifyWebhook = (req, res) => {
  // WhatsApp webhook verification
  try {
    const {
      "hub.mode": mode,
      "hub.challenge": challenge,
      "hub.verify_token": token,
    } = req.query;

    if (mode === "subscribe" && token === verifyToken) {
      console.log("WEBHOOK VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.status(403).end();
    }
  } catch (error) {
    console.log(
      "> [GET] /whatsapp/webhook | error verifying: ",
      error,
      verifyToken
    );
    return res.json({
      error,
      message: "> [GET] /whatsapp/webhook | error verifying",
    });
  }
};

export const handleWebhook = (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    console.log(`\n\nWebhook received ${timestamp}\n`);
    console.log(JSON.stringify(req.body, null, 2));
    res.status(200).end();
  } catch (error) {
    console.log(
      "> [POST] /whatsapp/webhook | error verifying: ",
      error,
      verifyToken
    );
    return res.json({
      error,
      message: "> [POST] /whatsapp/webhook | error verifying",
    });
  }
};
