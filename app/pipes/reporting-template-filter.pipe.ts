import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'reportingTemplateFilter',
    pure: false,
    standalone: true
})
export class ReportingTemplateFilter implements PipeTransform {
    transform(items:any,filter: any): any {
        if (!filter) {
            return items;
        }
        return items.filter(item => item.categoryId==filter);
    }
}