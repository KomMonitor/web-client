import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MultiStepHelperServiceService {
  constructor /*   private singleFeatureMapHelperService: SingleFeatureMapHelperService,
    private reachabilityMapHelperService: ReachabilityMapHelperService */() {
    /* intentionally empty */
  }

  /*
  MULTI STEP FORM STUFF
  */
  //jQuery time
  current_fs;
  next_fs;
  previous_fs; //fieldsets
  opacity;
  scale; //fieldset properties which we will animate
  animating; //flag to prevent quick multi-click glitches

  registerClickHandler(domId) {
    this.registerNextButtonClick();
    this.registerPreviousButtonClick();
    this.registerProgressBarItemClick(domId);
  }

  /**
   * Jumps the multi-step form back to its first fieldset/progressbar entry, e.g. when
   * the form is reset ("Zurücksetzen"). Next/previous/progressbar clicks all set inline
   * display/position styles that override the CSS defaults, so those must be reverted
   * explicitly rather than relying on the initial CSS state.
   */
  resetToFirstStep(domId) {
    const allFs: any = $('#' + domId).children('fieldset');
    const progressBar_listItems: any = $('#' + domId + ' #progressbar > li');

    for (let index = 0; index < allFs.length; index++) {
      const fs = $(allFs.get(index));
      if (index === 0) {
        fs.show();
        fs.css({ position: 'relative' });
      } else {
        fs.hide();
        fs.css({ position: 'absolute' });
      }
    }

    for (let index = 0; index < progressBar_listItems.length; index++) {
      const li = $(progressBar_listItems.get(index));
      if (index === 0) {
        li.addClass('active');
      } else {
        li.removeClass('active');
      }
    }

    this.current_fs = $(allFs.get(0));
    this.previous_fs = undefined;
    this.next_fs = undefined;
  }

  registerProgressBarItemClick(domId) {
    setTimeout(() => {
      const progressBar_listItems: any = $('#' + domId + ' #progressbar > li');
      progressBar_listItems.click((item: any) => {
        const newIndex = progressBar_listItems.index(item.target);
        const allFs: any = $($(item.target).parent().parent().parent().children('fieldset'));
        let activeFs;

        for (const fsCandidate of allFs) {
          if ($(fsCandidate).is(':visible')) {
            activeFs = fsCandidate;
            fsCandidate.style['display'] = 'block';
          } else {
            fsCandidate.style['display'] = 'none';
          }
        }
        const oldIndex = allFs.index(activeFs);

        this.current_fs = $(allFs.get(oldIndex));

        if (newIndex == oldIndex) {
          return;
        } else if (newIndex < oldIndex) {
          this.previous_fs = $(allFs.get(newIndex));

          //de-activate current step on progressbar
          for (let index = JSON.parse(JSON.stringify(oldIndex)); index > newIndex; index--) {
            $(progressBar_listItems.get(index)).removeClass('active');
          }

          //show the previous fieldset
          this.previous_fs.show();

          this.previous_fs.css({
            position: 'relative',
          });
          this.current_fs.css({
            position: 'absolute',
          });

          this.current_fs.hide();
        } else {
          this.animating = true;
          this.next_fs = $(allFs.get(newIndex));

          //activate next step on progressbar using the index of this.next_fs
          for (let index = JSON.parse(JSON.stringify(oldIndex)); index <= newIndex; index++) {
            $(progressBar_listItems.get(index)).addClass('active');
          }

          //show the next fieldset
          this.next_fs.show();

          this.next_fs.css({
            position: 'relative',
          });
          this.current_fs.css({
            position: 'absolute',
          });

          this.current_fs.hide();
        }

        // should any page be shown, where there is a single feature edit map then we must ensure that content is zoomed to
        /*   this.singleFeatureMapHelperService.invalidateMap();
        this.singleFeatureMapHelperService.zoomToDataLayer();

        this.reachabilityMapHelperService.invalidateMaps();
        this.reachabilityMapHelperService.zoomToIsochroneLayers(); */

        item.stopImmediatePropagation();
      });
    }, 500);
  }

  registerNextButtonClick() {
    setTimeout(() => {
      $('.next').click((item) => {
        this.current_fs = $(item.target).parent();
        this.next_fs = $(item.target).parent().next();

        //activate next step on progressbar using the index of this.next_fs
        $('#progressbar li').eq($('fieldset').index(this.next_fs)).addClass('active');

        //show the next fieldset
        this.next_fs.show();

        this.next_fs.css({
          position: 'relative',
        });
        this.current_fs.css({
          position: 'absolute',
        });

        this.current_fs.hide();

        // should any page be shown, where there is a single feature edit map then we must ensure that content is zoomed to
        /*  this.singleFeatureMapHelperService.invalidateMap();
        this.singleFeatureMapHelperService.zoomToDataLayer();

        this.reachabilityMapHelperService.invalidateMaps();
        this.reachabilityMapHelperService.zoomToIsochroneLayers(); */
      });
    }, 500);
  }

  registerPreviousButtonClick() {
    setTimeout(() => {
      $('.previous').click((item) => {
        this.current_fs = $(item.target).parent();
        this.previous_fs = $(item.target).parent().prev();

        //de-activate current step on progressbar
        $('#progressbar li').eq($('fieldset').index(this.current_fs)).removeClass('active');

        //show the previous fieldset
        this.previous_fs.show();
        this.previous_fs.css({
          position: 'relative',
        });
        this.current_fs.css({
          position: 'absolute',
        });
        this.current_fs.hide();

        // should any page be shown, where there is a single feature edit map then we must ensure that content is zoomed to
        /*   this.singleFeatureMapHelperService.invalidateMap(); */
        /*   this.singleFeatureMapHelperService.zoomToDataLayer(); */

        /*   this.reachabilityMapHelperService.invalidateMaps(); */
        /*   this.reachabilityMapHelperService.zoomToIsochroneLayers(); */
      });
    }, 500);
  }
}
