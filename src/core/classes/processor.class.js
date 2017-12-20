import { IdService } from 'core/services';

export class Processor {
  constructor(params) {
    this._class = Processor;
    this.test = 0;

    this.id = IdService.getId();
    this.name = params.name || this.id;
    this.init = params.init || (() => { });
    this.process = params.process || (() => { });
    this.destroy = params.destroy || (() => { });
  }
  preInit(instance, params) {
    instance._destroyWorkers = instance._destroyWorkers || [];
  }
  postDestroy(instance) {
    instance._destroyWorkers.forEach(worker => worker());
  }
}

Processor.instanceMethods = [];
