<script lang="ts">
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';

  import config from '$lib/config';
</script>

<div
  class="container relative mx-auto px-4 pt-20 sm:px-6 md:px-10 lg:px-20"
  id="FAQ"
>
  <h2
    class="mb-10 text-center font-CaviarDreams text-[32px] font-bold text-primary lg:text-[41px]"
  >
    FAQ
  </h2>

  <div class="flex flex-col gap-4 text-xl font-bold md:flex-row">
    <div class="w-full md:w-1/2">
      <Accordion>
        <AccordionItem>
          <svelte:fragment slot="summary"
            >What is Champagne Room?</svelte:fragment
          >
          <svelte:fragment slot="content">
            Champagne Room is a platform that provides a private and secure
            space where anyone can pay for a live, one-on-one video show with a
            performer of their choice. Just like a real Champagne Room, users
            are offered a personal VIP experience in a safe environment. In
            simple terms, if you want a video show with a performer, you can use
            Champagne Room to pay for the performance securely, anonymously, and
            with the support of a full escrow system.
          </svelte:fragment>
        </AccordionItem>
        <AccordionItem>
          <svelte:fragment slot="summary">How does it work?</svelte:fragment>
          <svelte:fragment slot="content">
            <ol class="ml-4 list-decimal">
              <li>
                Once you and the creator agree to a video performance, the
                creator will generate a unique, one-time link that will be
                shared with you.
              </li>
              <li>
                The link will bring you to the show page, where the agreed price
                and duration will be displayed. You will have options to
                purchase a ticket for the show.
              </li>
              <li>
                Complete the payment to the Champagne Room wallet. The Champagne
                Room holds the payment until after the show is completed.
              </li>
              <li>
                After the transaction is confirmed, the creator can start the
                show. Your ticket will indicate when the show has begun.
              </li>
              <li>
                Enjoy the private show! Your presence will remain confidential.
                Relax!
              </li>
              <li>
                After the show ends, you will have the opportunity to provide
                feedback about your experience.
              </li>
              <li>The creator is paid for the show.</li>
            </ol>
          </svelte:fragment>
        </AccordionItem>
        <AccordionItem>
          <svelte:fragment slot="summary">
            How are my transactions protected?
          </svelte:fragment>
          <svelte:fragment slot="content">
            When you make a payment, it does not go directly to the creator;
            instead, it is held in escrow. The escrow is only released after the
            show ends and you have the chance to provide feedback.

            <ul class="ml-4 list-disc">
              <li>
                If the creator cancels the show, you will receive a refund.
              </li>
              <li>
                If the creator fails to start the show, you will receive a
                refund.
              </li>
              <li>
                If you are dissatisfied with the show, you can initiate a
                dispute and request a refund.
              </li>
            </ul>
          </svelte:fragment>
        </AccordionItem>
      </Accordion>
    </div>
    <div class="w-full md:w-1/2">
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <Accordion>
        <AccordionItem>
          <svelte:fragment slot="summary">Is it anonymous?</svelte:fragment>
          <svelte:fragment slot="content">
            <div>
              We do not collect any data from our users, including email
              addresses or credit card information. When purchasing a ticket,
              you can enter any name you wish and create a PIN to identify
              yourself for future use if desired.
            </div>
            <div class="pt-4">
              When you return for another show (which we believe you will
              because Champagne Room is awesome), you can use a different name
              if you prefer. Our philosophy is that adults should be able to
              transact privately, without interference from us or anyone else.
            </div>
          </svelte:fragment>
        </AccordionItem>
        <AccordionItem>
          <svelte:fragment slot="summary">
            How is it different from other platforms like Only Fans?
          </svelte:fragment>
          <svelte:fragment slot="content">
            <ul class="ml-4 list-disc">
              <li>
                Firstly, unlike OnlyFans, we do not use credit cards; we use
                cryptocurrency for transactions. This means that credit card
                statements will not reveal any details to your spouse or others.
              </li>
              <li>
                OnlyFans collects your identity, whereas we do not. This is the
                most significant difference between us.
              </li>
              <li>
                OnlyFans creators are required to have a bank account in their
                own name, which excludes those who are unbanked. Champagne Room
                does not have this requirement.
              </li>
            </ul>
          </svelte:fragment>
        </AccordionItem>
        <AccordionItem>
          <svelte:fragment slot="summary">
            What is the road map and future of Champagne Room?
          </svelte:fragment>
          <svelte:fragment slot="content">
            <ul class="ml-4 list-disc">
              <li>
                As we receive feedback from our users, we will enhance Champagne
                Room's features.
              </li>
              <li>
                Currently, shows are one-on-one, but we plan to expand to
                one-to-many.
              </li>
              <li>
                The creator will be able to customize their own Champagne Rooms
                to reflect their style and preferences.
              </li>
              <li>
                The creator will have the option to sell media directly from
                their private pages using cryptocurrency.
              </li>
              <li>
                We plan to offer a token that will grant users special
                privileges with the creator, such as access to free private
                events, personalized NFTs, and the ability to participate in
                equity earning.
              </li>
            </ul>
          </svelte:fragment>
        </AccordionItem>
      </Accordion>
    </div>

    <div
      class="pointer-events-none absolute left-0 right-0 top-28 mx-auto grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <div
        class="image transition-timing-function mx-auto hidden max-w-lg animate-pulse opacity-20 md:flex"
      >
        <img
          class="motion-safe:animate-fadeIn mx-auto h-auto w-full justify-center rounded-lg opacity-45"
          src="{config.PATH.staticUrl}/assets/ladyblue.png"
          alt="Lady Blue"
        />
      </div>

      <div
        class="image transition-timing-function mx-auto hidden max-w-lg animate-pulse opacity-20 md:flex"
      >
        <img
          class="motion-safe:animate-fadeIn mx-auto h-auto w-full justify-center rounded-lg opacity-45"
          src="{config.PATH.staticUrl}/assets/ladypink.png"
          alt="Lady Pink"
        />
      </div>
    </div>
  </div>
</div>
