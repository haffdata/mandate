import { ElementRef, EventEmitter, Host, HostBinding, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { InputMenuRef } from './input-menu/input-menu-ref';
import { AbstractControl, ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import { OptionService } from './option.service';
import { BehaviorSubject, Subscription } from 'rxjs';

export abstract class BaseInputComponent implements ControlValueAccessor, Validator, OnDestroy {

    abstract _class: string;
    protected _customClass = '';

    protected inputMenuRef: InputMenuRef<any>;
    @ViewChild('inner') protected inner;

    // Inputs
    @Input() public placeholder;
    @Input() public required;
    @Input() set class(input) {
        this._customClass = input;
    }
    @Input() public tabIndex;

    // Outputs
    @Output() public change = new EventEmitter();
    @Output() public blur = new EventEmitter(); // TODO: Emit
    @Output() public keyup = new EventEmitter(); // TODO: Emit

    @Host() parent;

    public _disabled = false; // TODO: Convert to input.

    @HostBinding('class.focus')
    public _focused = false;

    @HostBinding('class') get elementClass() {
        return this._class + ' ' + this._customClass;
    }

    /**
     * Contains the current value of the input.
     */
    public value: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);

    /**
     * Contains Angular's OnChange hook.
     */
    private ngOnChange;

    /**
     * Contains Angular's OnTouched hook.
     */
    private ngOnTouched;

    /**
     * Contains the value subscription.
     */
    private valueSubscription: Subscription;

    constructor(
        private element: ElementRef,
        protected _optionService?: OptionService,
    ) {
        // Subscribe to value changes
        this.valueSubscription = this.value.subscribe((value) => {
            // Fire Angular's Form hook
            if (typeof this.ngOnChange !== 'undefined') {
                this.ngOnChange(value);
            }

            // Fire change-output
            this.change.emit(value);
        });
    }

    ngOnDestroy(): void {
        this.valueSubscription.unsubscribe();
    }

    onChange(event) {
        // this.change.emit(event);
    }

    onBlur(event) {
        this._focused = false;
        this.blur.emit(null);
    }

    onKeyup(event) {

    }

    onFocus(event) {
        this._focused = true;
        console.log('FOCUS', this.inner);
        this.inner.nativeElement.focus();
    }

    get nativeElement() {
        return this.element.nativeElement;
    }

    /**
     * Handle disable parameter from form.
     */
    public setDisabledState(disabled: boolean): void {
        this._disabled = disabled;
    }

    /**
     * Handle value changes in the form.
     */
    public writeValue(value: any): void {
        this.value.next(value);
    }

    /**
     * Register Angular's OnChange hook.
     */
    public registerOnChange(fn: any): void {
        this.ngOnChange = fn;
    }

    /**
     * Register Angular's OnTouched hook.
     */
    public registerOnTouched(fn: any): void {
        this.ngOnTouched = fn;
    }

    public registerOnValidatorChange(fn: () => void): void {
        // TODO: Necessary?
    }

    public validate(control: AbstractControl): ValidationErrors | null {
        // console.log('VALIDATE', control); // TODO: Necessary?
        return undefined;
    }
}