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
}

export default class SwarmFMApi {
    public get Playing() {
        return this.playing
    }
    public get Paused() {
        return !this.playing
    }
    public set Playing(playing: boolean) {
        if (playing) {
            this.Play()
        }
        else {
            this.Pause()
        }
    }
    public set Paused(paused: boolean) {
        this.Playing = !paused
    }

    public get Current() {
        return this.metadata?.current
    }
    public get Previous() {
        return this.metadata?.previous
    }
    public get Next() {
        return this.metadata?.next
    }

    private metadata?: SwarmFMMetadata
    private iframe?: HTMLIFrameElement
    private playing = false

    private callbacks: {
        [key in keyof SwarmFMEventMap]?: SwarmFMEventMap[keyof SwarmFMEventMap][]
    } = {}

    public Attach(iframe: HTMLIFrameElement) {
        this.iframe = iframe

        window.onmessage = (event) => {
            if (event.origin !== "https://swarmfm.swarmtunes.com") {
                return
            }
            switch (event.data.type) {
                case "SWARMFM_METADATA":
                    this.metadata = event.data.data
                    if (this.metadata) {
                        this.dispatchEvent("onmetadatachange", this.metadata)
                    }
                    break
                case "SWARMFM_PLAYING":
                    this.playing = true
                    this.dispatchEvent("onplay")
                    break
                case "SWARMFM_PAUSED":
                    this.playing = false
                    this.dispatchEvent("onpause")
                    break
                case "SWARMFM_READY":
                    this.dispatchEvent("onready")
                    break
            }
        }
    }

    public CreateIFrame(ops: { silent: "site" | "injector" | "all", "autoplay": boolean, "controls": boolean } = { silent: "injector", autoplay: false, controls: true }) {
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