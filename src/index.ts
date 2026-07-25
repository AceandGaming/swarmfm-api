export type SwarmFMSong = {
    artist: string
    bpm: number
    duration: number
    id: string
    name: string
    singer: string[]
    album_cover_id?: string
}
export type SwarmFMMetadata = {
    previous: SwarmFMSong
    current: SwarmFMSong
    next: SwarmFMSong
    position: number
}

interface SwarmFMEventMap {
    "onplay": () => void
    "onpause": () => void
    "onmetadatachange": (metadata: SwarmFMMetadata) => void
    "onready": () => void
    "ontimeupdate": (current: number) => void
}

export default class SwarmFMApi {
    public get playing() {
        return this.playingState
    }
    public get paused() {
        return !this.playing
    }
    public set playing(playing: boolean) {
        if (playing) {
            this.Play()
        }
        else {
            this.Pause()
        }
    }
    public set paused(paused: boolean) {
        this.playing = !paused
    }

    public get current() {
        return this.metadata?.current
    }
    public get previous() {
        return this.metadata?.previous
    }
    public get next() {
        return this.metadata?.next
    }
    public get currentTime() {
        return this.time
    }
    public set volume(val: number) {
        this.iframe?.contentWindow?.postMessage({
            type: "SWARMFM_VOLUME",
            data: val
        }, "*")
    }

    private metadata?: SwarmFMMetadata
    private iframe?: HTMLIFrameElement
    private playingState: boolean = false
    private ready: boolean = false
    private time: number = 0

    private callbacks: {
        [key in keyof SwarmFMEventMap]?: SwarmFMEventMap[keyof SwarmFMEventMap][]
    } = {}

    public Attach(iframe: HTMLIFrameElement) {
        this.iframe = iframe
        this.time = 0

        window.onmessage = (event) => {
            if (event.origin !== (new URL(iframe.src).origin)) {
                return
            }

            switch (event.data.type) {
                case "SWARMFM_METADATA":
                    this.metadata = event.data.data
                    this.dispatchEvent("onmetadatachange", this.metadata!)
                    break
                case "SWARMFM_PLAYING":
                    this.playingState = true
                    this.dispatchEvent("onplay")
                    break
                case "SWARMFM_PAUSED":
                    this.playingState = false
                    this.dispatchEvent("onpause")
                    break
                case "SWARMFM_READY":
                    this.dispatchEvent("onready")
                    this.ready = true
                    break
                case "SWARMFM_TIMEUPDATE":
                    this.dispatchEvent("ontimeupdate")
                    this.time = event.data.data
                    break
            }
        }
    }

    public CreateIFrame(ops: { silent: "site" | "injector" | "all" | "none", autoplay: boolean, controls: boolean } = { silent: "injector", autoplay: false, controls: true }) {
        const iframe = document.createElement("iframe")

        const prams = new URLSearchParams()
        prams.set("silent", ops.silent)
        prams.set("autoplay", ops.autoplay.toString())
        prams.set("nocontrols", (!ops.controls).toString())

        iframe.src = `https://swarmfm.swarmtunes.com/?${prams.toString()}`

        this.Attach(iframe)
        return iframe
    }

    public Play() {
        this.iframe?.contentWindow?.postMessage({
            type: "SWARMFM_PLAY"
        }, "*")
    }

    public Pause() {
        this.iframe?.contentWindow?.postMessage({
            type: "SWARMFM_PAUSE"
        }, "*")
    }

    public WaitForReady() {
        return new Promise<void>((resolve) => {
            if (this.ready) {
                resolve()
                return
            }
            this.addEventListener("onready", () => {
                resolve()
            })
        })
    }

    public addEventListener(event: keyof SwarmFMEventMap, callback: SwarmFMEventMap[keyof SwarmFMEventMap]) {
        if (this.callbacks[event] == null) {
            this.callbacks[event] = []
        }
        this.callbacks[event].push(callback)
    }

    public removeEventListener(event: keyof SwarmFMEventMap, callback: SwarmFMEventMap[keyof SwarmFMEventMap]) {
        if (this.callbacks[event] == null) {
            return
        }
        const index = this.callbacks[event].indexOf(callback)
        if (index > -1) {
            this.callbacks[event].splice(index, 1)
        }
    }

    private dispatchEvent(event: keyof SwarmFMEventMap, ...args: Parameters<SwarmFMEventMap[keyof SwarmFMEventMap]>) {
        if (this.callbacks[event] == null) {
            return
        }
        for (const callback of this.callbacks[event]) {
            // @ts-ignore
            callback(...args)
        }
    }
}