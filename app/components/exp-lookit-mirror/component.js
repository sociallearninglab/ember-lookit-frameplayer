import ExpLookitWebcamDisplay from '../exp-lookit-webcam-display/component';
import Ember from 'ember';

/**
 * A frame that extends exp-lookit-webcam-display but tries an iframe approach to show the mirrored camera
 *
 * @class Exp-lookit-mirror
 * @extends Exp-lookit-webcam-display
 */

export default ExpLookitWebcamDisplay.extend({
    type: 'exp-lookit-mirror',
    
    // Internal properties
    musicPlaying: false,
    audioPlayer: null,
    
    didInsertElement() {
        this._super(...arguments);
        
        console.log('EXP-LOOKIT-MIRROR: didInsertElement');
        
        // In addition to whatever the parent frame does, inject our own video mirror
        this._injectMirror();
        
        // Play background music
        this._setupAudio();
    },
    
    willDestroyElement() {
        this._super(...arguments);
        
        console.log('EXP-LOOKIT-MIRROR: willDestroyElement');
        
        // Clean up
        this._stopAudio();
        
        // Remove our injected mirror
        const mirrorElem = document.getElementById('direct-mirror-container');
        if (mirrorElem) {
            mirrorElem.remove();
        }
    },
    
    // Inject our own mirror element directly on top of the recorder
    _injectMirror() {
        // Find recorder container to position our mirror
        const recorderContainer = document.querySelector('.recorder-container');
        if (!recorderContainer) {
            console.log('Could not find recorder container for mirror injection');
            return;
        }
        
        console.log('Found recorder container, injecting mirror');
        
        // Create container for our mirror
        const mirrorContainer = document.createElement('div');
        mirrorContainer.id = 'direct-mirror-container';
        Object.assign(mirrorContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '100',
            backgroundColor: 'black'
        });
        
        // Create video element for our mirror
        const mirrorVideo = document.createElement('video');
        mirrorVideo.id = 'direct-mirror-video';
        mirrorVideo.autoplay = true;
        mirrorVideo.muted = true;
        mirrorVideo.playsinline = true;
        Object.assign(mirrorVideo.style, {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)'
        });
        
        // Add video to container
        mirrorContainer.appendChild(mirrorVideo);
        
        // Add container to the page (as first child of recorder container)
        if (recorderContainer.firstChild) {
            recorderContainer.insertBefore(mirrorContainer, recorderContainer.firstChild);
        } else {
            recorderContainer.appendChild(mirrorContainer);
        }
        
        // Get user media for our mirror
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                console.log('Got camera stream for direct mirror');
                mirrorVideo.srcObject = stream;
                mirrorVideo.play()
                    .then(() => console.log('Direct mirror playing'))
                    .catch(e => console.error('Error playing direct mirror:', e));
            })
            .catch(err => {
                console.error('Error getting camera for direct mirror:', err);
                // If we fail, remove our container so it doesn't block the view
                mirrorContainer.remove();
            });
    },
    
    _setupAudio() {
        const songUrl = this.get('songUrl');
        if (songUrl) {
            console.log('Setting up audio with URL:', songUrl);
            this.audioPlayer = new Audio(songUrl);
            this.audioPlayer.loop = true;
            this.audioPlayer.volume = 0.7; // 70% volume
            this.audioPlayer.play().catch(e => console.error("Audio error:", e));
        }
    },
    
    _stopAudio() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }
    },
    
    // Add our custom properties to the schema
    frameSchemaProperties: {
        // Include all properties from parent
        ...ExpLookitWebcamDisplay.prototype.frameSchemaProperties,
        
        /**
         * URL for the background music
         *
         * @property {String} songUrl
         */
        songUrl: {
            type: 'string',
            description: 'URL for background music to play during display'
        }
    }
});