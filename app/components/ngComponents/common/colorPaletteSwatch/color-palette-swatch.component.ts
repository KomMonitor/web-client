import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * Renders a single color palette as a row of SVG rectangles — one per color.
 * Purely presentational: give it the color array, it draws the swatch.
 */
@Component({
  selector: 'app-color-palette-swatch',
  templateUrl: './color-palette-swatch.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class ColorPaletteSwatchComponent {
  /** The palette colors to render, one rectangle each. */
  @Input() colors: string[] = [];

  /** Edge length (px) of each color rectangle. */
  @Input() swatchSize = 20;
}
