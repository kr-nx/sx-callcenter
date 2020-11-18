import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { ItemReorderEventDetail } from '@ionic/core';
import { PedidoDet } from '@models';

@Component({
  selector: 'sxcc-cortes-list',
  template: `
    <ion-list lines="full">
      <ion-reorder-group disabled="false" (ionItemReorder)="doReorder($event)">
        <ion-reorder *ngFor="let item of partidas; index as idx; odd as odd">
          <ion-item>
            <ion-label>
              {{ item.descripcion }}
            </ion-label>
          </ion-item>
        </ion-reorder>
      </ion-reorder-group>
      <ion-item>
        Corte importe: {{ parent.get('corteImporte').value | currency }}
      </ion-item>
    </ion-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CorteItemsListComponent {
  @Input() partidas: PedidoDet[] = [];
  @Input() parent: FormGroup;

  constructor() {}

  doReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    // The `from` and `to` properties contain the index of the item
    // when the drag started and ended, respectively
    console.log('Dragged from index', ev.detail.from, 'to', ev.detail.to);

    // Finish the reorder and position the item in the DOM based on
    // where the gesture ended. This method can also be called directly
    // by the reorder group
    ev.detail.complete(this.partidas);
  }
}
