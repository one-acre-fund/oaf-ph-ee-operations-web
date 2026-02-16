import { FormfieldBase } from './formfield-base';

export class SelectBase extends FormfieldBase {

  controlType = 'select';
  options: {
    label: string,
    value: string,
    data: {}[]
  };
  multiple: boolean;

  constructor(options: any = {}) {
    super(options);
    this.options = options['options'];
    this.multiple = options['multiple'] || false;
  }

}
