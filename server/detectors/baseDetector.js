/**
 * Base Detector Adapter Interface
 * Every detector provider adapter must implement this interface.
 */
export class BaseDetector {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  /**
   * Check if the detector has valid credentials configured in the environment.
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error('isConfigured() must be implemented');
  }

  /**
   * Returns provider capabilities (sentence highlights, paragraph analysis, languages, etc.)
   * @returns {object}
   */
  getCapabilities() {
    return {
      sentenceHighlights: false,
      paragraphScores: false,
      multilingual: false,
      burstinessScore: false,
      perplexityScore: false,
    };
  }

  /**
   * Runs detection on text and normalizes output.
   * @param {string} text
   * @param {object} options
   * @returns {Promise<NormalizedDetectionResult>}
   */
  async detect(_text, _options = {}) {
    throw new Error('detect() must be implemented');
  }
}
