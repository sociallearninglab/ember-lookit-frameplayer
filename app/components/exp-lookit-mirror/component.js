import ExpLookitWebcamDisplay from '../exp-lookit-webcam-display/component';
import Ember from 'ember';

/**
 * A frame that extends exp-lookit-webcam-display to add mirror functionality,
 * background music, timer, and automatic fullscreen.
 *
 * @class Exp-lookit-mirror
 * @extends Exp-lookit-webcam-display
 */

export default ExpLookitWebcamDisplay.extend({
    type: 'exp-lookit-mirror',
    
    // Internal properties
    musicPlaying: false,
    timerStarted: false,
    timerInterval: null,
    timeRemaining: null,
    audioPlayer: null,
    
    // Properties for display
    formattedTimeRemaining: Ember.computed('timeRemaining', function() {
        const minutes = Math.floor(this.get('timeRemaining') / 60);
        const seconds = this.get('timeRemaining') % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }),
    
    init() {
        this._super(...arguments);
        this.set('timeRemaining', this.get('duration'));
    },
    
    didInsertElement() {
        this._super(...arguments);
        
        console.log('EXP-LOOKIT-MIRROR: didInsertElement');
        
        // Add mirror effect and setup timer display
        Ember.run.later(() => {
            // Add mirror effect to video
            const videoElements = Ember.$('#recorder video');
            if (videoElements.length) {
                videoElements.css('transform', 'scaleX(-1)');
                console.log('Added mirror effect to video');
            } else {
                console.log('No video elements found to mirror');
            }
            
            // Add timer display
            const timerElement = Ember.$('<div class="mirror-timer"></div>');
            timerElement.text(this.get('formattedTimeRemaining'));
            Ember.$('.exp-lookit-mirror').append(timerElement);
            
            // Start timer
            this._startTimer();
            
            // Add instruction text if provided
            if (this.get('instructionText')) {
                const textElement = Ember.$('<div class="mirror-instruction-text"></div>');
                textElement.text(this.get('instructionText'));
                Ember.$('.exp-lookit-mirror').append(textElement);
            }
        }, 500);
        
        // Setup exit key listener
        this._setupKeyListener();
        
        // Play background music
        this._setupAudio();
        
        // Force fullscreen if requested
        if (this.get('forceFullscreen')) {
            Ember.run.later(() => {
                document.documentElement.requestFullscreen().catch(e => {
                    console.error('Error attempting to enable fullscreen:', e);
                });
            }, 1000);
        }
    },
    
    willDestroyElement() {
        this._super(...arguments);
        
        // Clean up
        this._stopTimer();
        this._stopAudio();
        
        // Remove keyboard listener
        if (this._boundKeyHandler) {
            document.removeEventListener('keydown', this._boundKeyHandler);
        }
        
        // Exit fullscreen if we're in it
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => {
                console.error('Error attempting to exit fullscreen:', e);
            });
        }
    },
    
    // Private methods
    _setupKeyListener() {
        this._boundKeyHandler = this._handleKeyPress.bind(this);
        document.addEventListener('keydown', this._boundKeyHandler);
    },
    
    _handleKeyPress(e) {
        // Check for 'e' key to exit
        if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            this.set('showExitConfirmation', true);
            
            // Create exit confirmation dialog if it doesn't exist
            if (!document.querySelector('.mirror-exit-confirmation')) {
                const dialog = Ember.$(`
                    <div class="mirror-exit-confirmation">
                        <div class="mirror-exit-dialog">
                            <h3>Are you sure you want to exit?</h3>
                            <div class="mirror-button-container">
                                <button class="mirror-exit-yes">Yes</button>
                                <button class="mirror-exit-no">No</button>
                            </div>
                        </div>
                    </div>
                `);
                
                // Attach event handlers
                dialog.find('.mirror-exit-yes').on('click', () => {
                    this.set('showExitConfirmation', false);
                    this._finishTrial();
                });
                
                dialog.find('.mirror-exit-no').on('click', () => {
                    this.set('showExitConfirmation', false);
                    dialog.hide();
                });
                
                Ember.$('.exp-lookit-mirror').append(dialog);
            } else {
                Ember.$('.mirror-exit-confirmation').show();
            }
        }
    },
    
    _startTimer() {
        if (!this.get('timerStarted')) {
            this.set('timerStarted', true);
            this.timerInterval = setInterval(() => {
                const timeRemaining = this.get('timeRemaining');
                if (timeRemaining <= 0) {
                    this._stopTimer();
                    this._finishTrial();
                } else {
                    this.set('timeRemaining', timeRemaining - 1);
                    // Update timer display
                    Ember.$('.mirror-timer').text(this.get('formattedTimeRemaining'));
                }
            }, 1000);
        }
    },
    
    _stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
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
    
    _finishTrial() {
        this._stopTimer();
        this._stopAudio();
        
        // Calculate actual duration viewed
        const completedDuration = this.get('duration') - this.get('timeRemaining');
        this.set('completedDuration', completedDuration);
        
        // Use the parent's proceed action
        this.send('proceed');
    },
    
    // Add our custom properties to the schema
    frameSchemaProperties: {
        // Include all properties from parent
        ...ExpLookitWebcamDisplay.prototype.frameSchemaProperties,
        
        /**
         * Duration of the mirror display in seconds
         *
         * @property {Number} duration
         * @default 180
         */
        duration: {
            type: 'number',
            default: 180,
            description: 'Duration of the mirror display in seconds'
        },
        
        /**
         * URL for the background music
         *
         * @property {String} songUrl
         */
        songUrl: {
            type: 'string',
            description: 'URL for background music to play during display'
        },
        
        /**
         * Whether to force fullscreen on load
         * @property {Boolean} forceFullscreen
         * @default true
         */
        forceFullscreen: {
            type: 'boolean',
            default: true,
            description: 'Whether to force fullscreen on load'
        },
        
        /**
         * Text to display at the bottom of the mirror display
         *
         * @property {String} instructionText
         * @default Look who it is!
         */
        instructionText: {
            type: 'string',
            default: 'Look who it is!',
            description: 'Text to display at the bottom of the mirror display'
        }
    },
    
    meta: {
        name: 'Mirror Display',
        description: 'Extends webcam display to add mirror effect, timer, music, and other features',
        data: {
            type: 'object',
            properties: {
                // Include all data properties from parent
                ...ExpLookitWebcamDisplay.prototype.meta.data.properties,
                
                // Add our new property
                completedDuration: {
                    type: 'number'
                }
            }
        }
    }
});