import NativeObject from './NativeObject';

export default NativeObject.extend({
  _cid: 'tabris.App',
  _events: {
    foreground: {trigger: triggerWithTarget},
    resume: {trigger: triggerWithTarget},
    pause: {trigger: triggerWithTarget},
    background: {trigger: triggerWithTarget},
    terminate: {trigger: triggerWithTarget},
    open: {name: 'Open', trigger: triggerWithTarget},
    patchInstall: {trigger: notifyPatchCallback},
    backnavigation: {
      trigger() {
        let intercepted = false;
        let event = {};
        event.preventDefault = function() {
          intercepted = true;
        };
        this.trigger('backnavigation', this, event);
        // TODO [2.0]: Remove compat support for setting preventDefault to false
        return intercepted || (event.preventDefault === true);
      }
    }
  },
  getResourceLocation(path) {
    if (!this._resourceBaseUrl) {
      this._resourceBaseUrl = this._nativeGet('resourceBaseUrl');
    }
    let subPath = path != null ? '/' + normalizePath('' + path) : '';
    return this._resourceBaseUrl + subPath;
  },
  dispose() {
    throw new Error('tabris.app can not be disposed');
  },
  reload() {
    this._nativeCall('reload', {});
  },
  installPatch(url, callback) {
    if (typeof url !== 'string') {
      throw new Error('parameter url is not a string');
    }
    if (!this._pendingPatchCallback) {
      this._pendingPatchCallback = callback || true;
      this._listen('patchInstall', true);
      this._nativeCall('installPatch', {url});
    } else if (typeof callback === 'function') {
      callback(new Error('Another installPatch operation is already pending.'));
    }
  }
});

function triggerWithTarget(event, name) {
  this.trigger(name, this, event);
}

function notifyPatchCallback(event) {
  this._listen('patchInstall', false);
  let callback = this._pendingPatchCallback;
  delete this._pendingPatchCallback;
  if (typeof callback === 'function') {
    if (event.error) {
      callback(new Error(event.error));
    } else {
      try {
        let patch = event.success ? JSON.parse(event.success) : null;
        callback(null, patch);
      } catch (error) {
        callback(new Error('Failed to parse patch.json'));
      }
    }
  }
}

function normalizePath(path) {
  return path.split(/\/+/).map((segment) => {
    if (segment === '..') {
      throw new Error("Path must not contain '..'");
    }
    if (segment === '.') {
      return '';
    }
    return segment;
  }).filter(string => !!string).join('/');
}
