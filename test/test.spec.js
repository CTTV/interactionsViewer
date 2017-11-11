import 'core-js/es6';
import chai from 'chai';
import interactionsViewer from '../index.js';

let assert = chai.assert;

describe('Plugin', () => {
  let iv;
  beforeEach(() => {
    iv = interactionsViewer();
  });

  it('can be instantiated', () => {
    assert.isDefined(iv);
  });


  describe('API', () => {
    it('jumps');
    it('runs');
  });

  describe('Renders', () => {
    beforeEach(() => {
      let fixture = '<div id="container"></div>';
      document.body.insertAdjacentHTML('afterbegin', fixture);
    });
    it('has a container', () => {
      let container = document.getElementById('container');
      assert.isDefined(container);
    });
    it('creates an svg element', () => {
      iv(document.getElementById('container'));
      assert.isNotNull(document.querySelector('#container svg'));
    });
  });
});


