import ExpLookitWebcamDisplay from '../exp-lookit-webcam-display/component';
import Ember from 'ember';

/**
 * A frame that extends exp-lookit-webcam-display to add mirror functionality
 * and background music.
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
        
        // Setup MutationObserver to detect when video element is created
        this._setupMutationObserver();
        
        // Play background music
        this._setupAudio();
        
        // Also add a debug display
        this._addDebugDisplay();
    },
    
    willDestroyElement() {
        this._super(...arguments);
        
        console.log('EXP-LOOKIT-MIRROR: willDestroyElement');
        
        // Clean up
        this._stopAudio();
        
        // Disconnect observer if exists
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Remove debug display
        const debugDiv = document.getElementById('mirror-debug-display');
        if (debugDiv) {
            debugDiv.remove();
        }
    },
    
    // Setup MutationObserver to watch for video element creation
    _setupMutationObserver() {
        // Create a MutationObserver to watch for changes to the DOM
        this.observer = new MutationObserver((mutations) => {
            // Check if any video elements were added
            let videoAdded = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        // If a video element was added directly
                        if (node.nodeName === 'VIDEO') {
                            console.log('VIDEO element added directly to DOM', node);
                            this._mirrorVideo(node);
                            videoAdded = true;
                        }
                        // Or if something containing a video was added
                        else if (node.nodeType === 1) { // Element node
                            const videos = node.querySelectorAll('video');
                            if (videos.length > 0) {
                                console.log(`${videos.length} VIDEO elements found in added node`, node);
                                videos.forEach(video => this._mirrorVideo(video));
                                videoAdded = true;
                            }
                        }
                    });
                }
            });
            
            if (videoAdded) {
                this._updateDebugDisplay();
            }
        });
        
        // Start observing the entire document for changes
        this.observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        
        console.log('MutationObserver setup to watch for video elements');
    },
    
    // Mirror a video element
    _mirrorVideo(videoElement) {
        console.log('Mirroring video element', videoElement);
        
        // Apply mirroring and ensure visibility
        Object.assign(videoElement.style, {
            transform: 'scaleX(-1) !important',
            width: '100% !important',
            height: '100% !important',
            objectFit: 'cover !important',
            opacity: '1 !important',
            visibility: 'visible !important',
            display: 'block !important'
        });
        
        // Add a class to the video for CSS targeting
        videoElement.classList.add('mirrored-video');
        
        // Also add an inline style element to ensure our styles aren't overridden
        const styleId = 'mirror-video-styles';
        if (!document.getElementById(styleId)) {
            const styleTag = document.createElement('style');
            styleTag.id = styleId;
            styleTag.textContent = `
                video, .pipeNormal, .pipeSmallNormal {
                    transform: scaleX(-1) !important;
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    display: block !important;
                }
                
                #recorder {
                    width: 100% !important;
                    height: 100% !important;
                    background-color: black !important;
                }
                
                .recorder-container {
                    width: 100% !important;
                    height: 100% !important;
                }
            `;
            document.head.appendChild(styleTag);
            console.log('Added global style element for video mirroring');
        }
        
        // Update the debug display
        this._updateDebugDisplay();
    },
    
    // Add a debug display to show DOM status
    _addDebugDisplay() {
        const debugDiv = document.createElement('div');
        debugDiv.id = 'mirror-debug-display';
        Object.assign(debugDiv.style, {
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: '9999',
            borderRadius: '5px',
            maxWidth: '80%',
            maxHeight: '200px',
            overflow: 'auto'
        });
        
        document.body.appendChild(debugDiv);
        this._updateDebugDisplay();
        
        // Update periodically
        setInterval(() => this._updateDebugDisplay(), 1000);
    },
    
    // Update the debug display with current info
    _updateDebugDisplay() {
        const debugDiv = document.getElementById('mirror-debug-display');
        if (!debugDiv) return;
        
        // Check for video elements
        const allVideos = document.querySelectorAll('video');
        const recorderElem = document.getElementById('recorder');
        const recorderContainer = document.querySelector('.recorder-container');
        
        let html = '<h3>Mirror Debug</h3>';
        html += `<p>Video elements: ${allVideos.length}</p>`;
        
        // Video details
        allVideos.forEach((video, i) => {
            const styles = window.getComputedStyle(video);
            html += `<p>Video ${i+1}: ${video.id || 'no id'}
                <br>Dims: ${video.offsetWidth}x${video.offsetHeight}
                <br>Visible: ${styles.display !== 'none' && styles.visibility !== 'hidden'}
                <br>Transform: ${styles.transform}
                <br>Source: ${video.src || 'stream'}
            </p>`;
        });
        
        // Recorder info
        html += `<p>Recorder element: ${recorderElem ? 'Yes' : 'No'}</p>`;
        if (recorderElem) {
            html += `<p>Recorder dims: ${recorderElem.offsetWidth}x${recorderElem.offsetHeight}</p>`;
        }
        
        // Container info
        html += `<p>Recorder container: ${recorderContainer ? 'Yes' : 'No'}</p>`;
        if (recorderContainer) {
            html += `<p>Container dims: ${recorderContainer.offsetWidth}x${recorderContainer.offsetHeight}</p>`;
        }
        
        debugDiv.innerHTML = html;
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