# SwarmFMApi
`SwarmFMApi` is a lightweight JavaScript/TypeScript API for integrating and controlling [SwarmFM](https://player.sw.arm.fm/)
music playback in your web applications. It allows you to embed the SwarmFM player via an iframe, control playback programmatically, and respond to metadata and playback events.

**Note: This api is unofficial and not affiliated with SwarmFM or boop.**

This api uses server-side injection and thus the normal SwarmFM domains won't work. If creating the iframe manually you must use a site like `swarmfm.swarmtunes.com` or inject the site yourself.

## Install

`npm install @aceandgaming/swarmfm-api`

## Usage
```TS
import SwarmFMApi from '@aceandgaming/swarmfm-api';

// Create an instance
const api = new SwarmFMApi();

// Create and attach iframe
const iframe = api.CreateIFrame({ silent: 'none', autoplay: false, controls: true });
document.body.appendChild(iframe);

api.WaitForReady().then(() => {
    // Play or pause
    api.Play();
    api.Pause();
})


// Listen to events
api.addEventListener('onplay', () => console.log('Music started playing'));
api.addEventListener('onmetadatachange', (metadata) => console.log('Now playing:', metadata.current));
```

## API

### Properties

|Property|Type|Description|
|--------|----|-----------|
|`playing`      |`boolean`|                     Get or set whether the player is currently playing. Setting `true` plays, false `pauses`.|
|`paused`       |`boolean`|                     Get or set whether the player is paused. Inverse of `Playing`.|
|`current`      |`TrackMetadata?`|   Returns metadata of the currently playing track.|
|`previous`     |`TrackMetadata?`|   Returns metadata of the previous track.|
|`next`         |`TrackMetadata?`|   Returns metadata of the next track.|
|`currentTime`         |`number`|   The current time played.|

### Methods

|Method|Description|
|------|-----------|
|`CreateIFrame(options?)`|                      Creates a iframe and automaticly attaches it|
|`Attach(iframe: HTMLIFrameElement)`|           Attaches the API to an existing SwarmFM iframe and listens for events.
|`Play()`|                                      Sends a message to the iframe to start playback.|
|`Pause()`|                                     Sends a message to the iframe to pause playback.|
|`WaitForReady()`|                              A async function that resolves when the player is ready|
|`addEventListener(event: string, callback: Function)`|Registers an event listener.
|`removeEventListener(event: string, callback: Function)`|Removes a previously registered listener.|

### Events

| Event              | Arguments                   | Description                                                      |
| ------------------ | --------------------------- | ---------------------------------------------------------------- |
| `onplay`           | None                        | Triggered when playback starts.                                  |
| `onpause`          | None                        | Triggered when playback is paused.                               |
| `onmetadatachange` | `metadata: SwarmFMMetadata` | Triggered when track metadata updates (current, previous, next). |
| `onready`          | None                        | Triggered when the player is ready for playback.                 |
| `ontimeupdate`     | `current: number`           | Called when the currentTime updates                              |
