import {
    Component,
    ComponentRef,
    ElementRef,
    EmbeddedViewRef,
    EventEmitter,
    Inject,
    Optional,
    ChangeDetectorRef,
    ViewChild,
    ViewEncapsulation,
    ChangeDetectionStrategy,
} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {AnimationEvent} from '@angular/animations';
import {
    BasePortalOutlet,
    ComponentPortal,
    CdkPortalOutlet,
    TemplatePortal
} from '@angular/cdk/portal';
import {FocusTrap, FocusTrapFactory} from '@angular/cdk/a11y';
import {ManDialogConfig} from './dialog-config';
import {manDialogAnimations} from './dialog-animations';


/**
 * Throws an exception for the case when a ComponentPortal is
 * attached to a DomPortalOutlet without an origin.
 * @docs-private
 */
export function throwMatDialogContentAlreadyAttachedError() {
    throw Error('Attempting to attach dialog content after content is already attached');
}

@Component({
    // moduleId: module.id,
    selector: 'man-dialog-container',
    templateUrl: 'dialog-container.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Default,
    animations: [manDialogAnimations.slideDialog],
    host: {
        '[attr.class]': '_config?.panelClass',
        'tabindex': '-1',
        '[attr.id]': '_id',
        '[attr.role]': '_config?.role',
        '[attr.aria-labelledby]': '_config?.ariaLabel ? null : _ariaLabelledBy',
        '[attr.aria-label]': '_config?.ariaLabel',
        '[attr.aria-describedby]': '_config?.ariaDescribedBy || null',
        '[@slideDialog]': '_state',
        '(@slideDialog.start)': '_onAnimationStart($event)',
        '(@slideDialog.done)': '_onAnimationDone($event)',
    },
})
export class ManDialogContainerComponent extends BasePortalOutlet {
    /** The portal outlet inside of this container into which the dialog content will be loaded. */
    @ViewChild(CdkPortalOutlet) _portalOutlet: CdkPortalOutlet;

    /** The class that traps and manages focus within the dialog. */
    private _focusTrap: FocusTrap;

    /** Element that was focused before the dialog was opened. Save this to restore upon close. */
    private _elementFocusedBeforeDialogWasOpened: HTMLElement | null = null;

    /** The dialog configuration. */
    _config: ManDialogConfig;

    /** State of the dialog animation. */
    _state: 'void' | 'enter' | 'exit' = 'enter';

    /** Emits when an animation state changes. */
    _animationStateChanged = new EventEmitter<AnimationEvent>();

    /** ID of the element that should be considered as the dialog's label. */
    _ariaLabelledBy: string | null = null;

    /** ID for the container DOM element. */
    _id: string;

    constructor(
        private _elementRef: ElementRef,
        private _focusTrapFactory: FocusTrapFactory,
        private _changeDetectorRef: ChangeDetectorRef,
        @Optional() @Inject(DOCUMENT) private _document: any) {
        super();
    }

    /**
     * Attach a ComponentPortal as content to this dialog container.
     * @param portal Portal to be attached as the dialog content.
     */
    attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
        if (this._portalOutlet.hasAttached()) {
            throwMatDialogContentAlreadyAttachedError();
        }

        this._savePreviouslyFocusedElement();
        return this._portalOutlet.attachComponentPortal(portal);
    }

    /**
     * Attach a TemplatePortal as content to this dialog container.
     * @param portal Portal to be attached as the dialog content.
     */
    attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
        if (this._portalOutlet.hasAttached()) {
            throwMatDialogContentAlreadyAttachedError();
        }

        this._savePreviouslyFocusedElement();
        return this._portalOutlet.attachTemplatePortal(portal);
    }

    /** Moves the focus inside the focus trap. */
    private _trapFocus() {
        if (!this._focusTrap) {
            this._focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement);
        }

        // If were to attempt to focus immediately, then the content of the dialog would not yet be
        // ready in instances where change detection has to run first. To deal with this, we simply
        // wait for the microtask queue to be empty.
        if (this._config.autoFocus) {
            this._focusTrap.focusInitialElementWhenReady();
        }
    }

    /** Restores focus to the element that was focused before the dialog opened. */
    private _restoreFocus() {
        const toFocus = this._elementFocusedBeforeDialogWasOpened;

        // We need the extra check, because IE can set the `activeElement` to null in some cases.
        if (toFocus && typeof toFocus.focus === 'function') {
            toFocus.focus();
        }

        if (this._focusTrap) {
            this._focusTrap.destroy();
        }
    }

    /** Saves a reference to the element that was focused before the dialog was opened. */
    private _savePreviouslyFocusedElement() {
        if (this._document) {
            this._elementFocusedBeforeDialogWasOpened = this._document.activeElement as HTMLElement;

            // Note that there is no focus method when rendering on the server.
            if (this._elementRef.nativeElement.focus) {
                // Move focus onto the dialog immediately in order to prevent the user from accidentally
                // opening multiple dialogs at the same time. Needs to be async, because the element
                // may not be focusable immediately.
                Promise.resolve().then(() => this._elementRef.nativeElement.focus());
            }
        }
    }

    /** Callback, invoked whenever an animation on the host completes. */
    _onAnimationDone(event: AnimationEvent) {
        if (event.toState === 'enter') {
            this._trapFocus();
        } else if (event.toState === 'exit') {
            this._restoreFocus();
        }

        this._animationStateChanged.emit(event);
    }

    /** Callback, invoked when an animation on the host starts. */
    _onAnimationStart(event: AnimationEvent) {
        this._animationStateChanged.emit(event);
    }

    /** Starts the dialog exit animation. */
    _startExitAnimation(): void {
        this._state = 'exit';

        // Mark the container for check so it can react if the
        // view container is using OnPush change detection.
        this._changeDetectorRef.markForCheck();
    }
}
