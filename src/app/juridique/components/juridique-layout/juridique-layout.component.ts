import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
// Sidebar locale désactivée - On utilise la sidebar principale
// import { JuridiqueSidebarComponent } from '../juridique-sidebar/juridique-sidebar.component';

@Component({
  selector: 'app-juridique-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet], // JuridiqueSidebarComponent retiré
  templateUrl: './juridique-layout.component.html',
  styleUrls: ['./juridique-layout.component.scss']
})
export class JuridiqueLayoutComponent {
  constructor() {}
}
