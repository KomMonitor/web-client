import { NgModule } from "@angular/core";
import { SafeHtmlPipe } from "pipes/safe-html.pipe";

@NgModule({
  declarations: [SafeHtmlPipe],
  exports: [SafeHtmlPipe]
})
export class PipesModule {}
