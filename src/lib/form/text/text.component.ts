import { Component, ViewEncapsulation, ChangeDetectionStrategy, Injector, forwardRef, OnDestroy, HostBinding, Input } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { OptionService } from '../shared/option.service';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BaseInputComponent } from '../shared/input-menu/base-input.component';

@Component({
    // moduleId: module.id,
    selector: 'man-text',
    templateUrl: './text.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Default,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextComponent),
            multi: true,
        }
    ]
})
export class TextComponent extends BaseInputComponent implements OnDestroy {

    @Input() mask;
    _class = 'form-control man-form-control';
    public controlValue = '';
    private controlValueSubscription: Subscription;

    constructor(overlay: Overlay, injector: Injector, optionService: OptionService) {
        super(optionService);

        this.controlValueSubscription = this.value.subscribe((value) => {
            this.controlValue = value;
        });
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        this.controlValueSubscription.unsubscribe();
    }
}
