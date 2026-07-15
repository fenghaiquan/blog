import satori from 'satori';

export function createOGTemplate({ title, description, date, tags, siteName }) {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 80px',
        background: '#FAF8F5',
        fontFamily: 'LXGW WenKai',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              flex: 1,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '52px',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    color: '#1C1917',
                    maxWidth: '900px',
                  },
                  children: title,
                },
              },
              description && {
                type: 'div',
                props: {
                  style: {
                    fontSize: '28px',
                    color: '#78716C',
                    lineHeight: 1.5,
                    maxWidth: '800px',
                  },
                  children: description,
                },
              },
              tags && tags.length > 0 && {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginTop: '8px',
                  },
                  children: tags.map((tag) => ({
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '20px',
                        color: '#92400E',
                        background: 'rgba(146, 64, 14, 0.1)',
                        padding: '6px 16px',
                        borderRadius: '6px',
                      },
                      children: tag,
                    },
                  })),
                },
              },
            ].filter(Boolean),
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '2px solid #E7E5E4',
              paddingTop: '24px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '28px',
                    fontWeight: 500,
                    color: '#92400E',
                  },
                  children: siteName || "Feng's Blog",
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '24px',
                    color: '#78716C',
                  },
                  children: date,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export async function generateOGImage(element, fonts, width = 1200, height = 630) {
  const svg = await satori(element, {
    width,
    height,
    fonts,
  });
  return svg;
}
