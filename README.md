# Keep Loudoun Beautiful - Roadside

Keep Loudoun Beautiful - Roadside is an installable web app for reporting illegal sign violations in Loudoun County. It guides you through taking a photo, confirming the sign's location and address, and submitting the report to Loudoun County through PublicStuff.

## Submit a report

1. **Register for a PublicStuff account** before submitting. Loudoun County requires a PublicStuff account; [register or sign in on PublicStuff](https://iframe.publicstuff.com/#/?client_id=1295&request_type_id=1011942).
2. Open KLB: Roadside and complete the one-time contact and PublicStuff sign-in setup.
3. Take a clear photo of the sign. Confirm or edit the detected address and add an optional note.
4. Select **Submit report**. A successful submission shows the PublicStuff request ID.

The app shows these steps once on its first launch, including a link to PublicStuff registration. It starts directly at setup or capture on later launches.

## Privacy

### Stored on this device

KLB: Roadside stores the following in this browser's local IndexedDB storage on the device:

- Your complaint contact details: name, address, email, phone number, and disclosure preference.
- Your PublicStuff account email and a returned PublicStuff session key. Your password is sent to PublicStuff for sign-in and is not stored.
- At most one unfinished report: its photo, GPS coordinates and accuracy, suggested or edited address, optional note, and capture time.
- A flag that records that the first-launch introduction has been shown.

Anyone able to unlock the device and open the installed app may be able to access this local data. **Reset all app data** in Settings deletes the stored profile, session key, and pending report from the app's IndexedDB storage.

### Sent when you use the app

- Sign-in credentials are sent directly to PublicStuff only when you choose to sign in.
- After you tap **Submit report**, the photo, reviewed location/address, optional note, contact details, disclosure choice, and PublicStuff session key are sent to PublicStuff for the Loudoun County report.
- Address lookup sends the captured coordinates to OpenStreetMap's Nominatim service after a photo is taken or you retry location.

KLB: Roadside does not include analytics or its own server. The pending photo is removed from local app storage after PublicStuff confirms a successful submission.

## Development

```sh
npm install
npm run dev
npm test
npm run build
```

The app is a Vite + TypeScript PWA. Production builds submit reports directly to PublicStuff; `npm run build` verifies that the submission adapter is included. Keep test fixtures synthetic or redacted and never commit credentials, contact data, precise locations, photos, or raw browser network captures.
