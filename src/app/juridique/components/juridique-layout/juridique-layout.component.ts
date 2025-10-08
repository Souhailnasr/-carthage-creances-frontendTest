import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { JuridiqueSidebarComponent } from '../juridique-sidebar/juridique-sidebar.component';

@Component({
  selector: 'app-juridique-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, JuridiqueSidebarComponent],
  templateUrl: './juridique-layout.component.html',
  styleUrls: ['./juridique-layout.component.scss']
})
export class JuridiqueLayoutComponent {
  constructor() {}
}
